import {
  BreakpointId,
  Result as EvaluationResult,
  ExecutionPoint,
  FocusWindowRequest,
  FrameId,
  FunctionMatch,
  loadedRegions as LoadedRegions,
  Location,
  MappedLocation,
  Message,
  ObjectId,
  ObjectPreviewLevel,
  PauseData,
  PauseId,
  PointDescription,
  PointPageLimits,
  PointRange,
  PointSelector,
  getPointsBoundingTimeResult as PointsBoundingTime,
  RecordingId,
  RequestEventInfo,
  RequestInfo,
  Result,
  RunEvaluationResult,
  SameLineSourceLocations,
  ScopeId,
  ScreenShot,
  SearchSourceContentsMatch,
  SessionId,
  newSource as Source,
  SourceId,
  TimeStampedPoint,
  TimeStampedPointRange,
  VariableMapping,
  createPauseResult,
  findPointsResults,
  functionsMatches,
  getAllFramesResult,
  getExceptionValueResult,
  getScopeResult,
  getTopFrameResult,
  keyboardEvents,
  navigationEvents,
  repaintGraphicsResult,
  requestBodyData,
  responseBodyData,
  runEvaluationResults,
  searchSourceContentsMatches,
  sourceContentsChunk,
  sourceContentsInfo,
} from "@replayio/protocol";
import throttle from "lodash/throttle";
import uniqueId from "lodash/uniqueId";

// eslint-disable-next-line no-restricted-imports
import { addEventListener, client, initSocket, removeEventListener } from "protocol/socket";
import { ThreadFront } from "protocol/thread";
import { binarySearch, compareNumericStrings, defer, waitForTime } from "protocol/utils";
import { initProtocolMessagesStore } from "replay-next/components/protocol/ProtocolMessagesStore";
import { areRangesEqual } from "replay-next/src/utils/time";
import { TOO_MANY_POINTS_TO_FIND } from "shared/constants";
import { ProtocolError, commandError, isCommandError } from "shared/utils/error";
import { isPointInRegions, isRangeInRegions, isTimeInRegions } from "shared/utils/time";

import {
  LineNumberToHitCountMap,
  ReplayClientEvents,
  ReplayClientInterface,
  SourceLocationRange,
} from "./types";

export const MAX_POINTS_TO_FIND = 10_000;
export const MAX_POINTS_TO_RUN_EVALUATION = 200;

const STREAMING_THROTTLE_DURATION = 100;

// TODO How should the client handle concurrent requests?
// Should we force serialization?
// Should we cancel in-flight requests and start new ones?

type GetPreferredLocation = (locations: Location[]) => Location | null;

export class ReplayClient implements ReplayClientInterface {
  private _dispatchURL: string;
  private _eventHandlers: Map<ReplayClientEvents, Function[]> = new Map();
  private _injectedGetPreferredLocation: GetPreferredLocation | null = null;
  private _loadedRegions: LoadedRegions | null = null;
  private _recordingId: RecordingId | null = null;
  private _sessionId: SessionId | null = null;
  private _threadFront: typeof ThreadFront;

  private sessionWaiter = defer<SessionId>();

  private nextFindPointsId = 1;
  private nextRunEvaluationId = 1;

  constructor(dispatchURL: string, threadFront: typeof ThreadFront) {
    this._dispatchURL = dispatchURL;
    this._threadFront = threadFront;

    this._threadFront.listenForLoadChanges(this._onLoadChanges);
  }

  private getSessionIdThrows(): SessionId {
    const sessionId = this._sessionId;
    if (sessionId === null) {
      throw Error("Invalid session");
    }
    return sessionId;
  }

  // Configures the client to use an already initialized session iD.
  // This method should be used for apps that use the protocol package directly.
  // Apps that only communicate with the Replay protocol through this client should use the initialize method instead.
  configure(sessionId: string): void {
    this._sessionId = sessionId;
    this.sessionWaiter.resolve(sessionId);
  }

  waitForSession() {
    return this.sessionWaiter.promise;
  }

  get loadedRegions(): LoadedRegions | null {
    return this._loadedRegions;
  }

  addEventListener(type: ReplayClientEvents, handler: Function): void {
    if (!this._eventHandlers.has(type)) {
      this._eventHandlers.set(type, []);
    }

    const handlers = this._eventHandlers.get(type)!;
    handlers.push(handler);
  }

  async breakpointAdded(location: Location, condition: string | null): Promise<BreakpointId[]> {
    const sessionId = this.getSessionIdThrows();

    const correspondingLocations = this.getCorrespondingLocations(location);

    const breakpointIds: BreakpointId[] = await Promise.all(
      correspondingLocations.map(async location => {
        const { breakpointId } = await client.Debugger.setBreakpoint(
          {
            condition: condition || undefined,
            location,
          },
          sessionId
        );

        return breakpointId;
      })
    );

    return breakpointIds;
  }

  async breakpointRemoved(breakpointId: BreakpointId): Promise<void> {
    const sessionId = this.getSessionIdThrows();
    await client.Debugger.removeBreakpoint({ breakpointId }, sessionId);
  }

  async getBuildId(): Promise<string> {
    const sessionId = await this.waitForSession();
    const { buildId } = await client.Session.getBuildId({}, sessionId);
    return buildId;
  }

  async createPause(executionPoint: ExecutionPoint): Promise<createPauseResult> {
    const sessionId = this.getSessionIdThrows();

    await this._waitForPointToBeLoaded(executionPoint);

    const response = await client.Session.createPause({ point: executionPoint }, sessionId);

    return response;
  }

  async evaluateExpression(
    pauseId: PauseId,
    expression: string,
    frameId: FrameId | null
  ): Promise<EvaluationResult> {
    const sessionId = this.getSessionIdThrows();

    // Edge case handling:
    // User is logging a plan object (e.g. "{...}")
    // This expression will not evaluate correctly unless we wrap parens around it
    if (expression.startsWith("{") && expression.endsWith("}")) {
      expression = `(${expression})`;
    }

    if (frameId === null) {
      const response = await client.Pause.evaluateInGlobal(
        {
          expression,
          pure: false,
        },
        sessionId,
        pauseId
      );
      return response.result;
    } else {
      const response = await client.Pause.evaluateInFrame(
        {
          frameId,
          expression,
          pure: false,
          useOriginalScopes: true,
        },
        sessionId,
        pauseId
      );
      return response.result;
    }
  }

  // Initializes the WebSocket and remote session.
  // This method should be used for apps that only communicate with the Replay protocol through this client.
  // Apps that use the protocol package directly should use the configure method instead.
  async initialize(recordingId: RecordingId, accessToken: string | null): Promise<SessionId> {
    this._recordingId = recordingId;

    initProtocolMessagesStore();

    const socket = initSocket(this._dispatchURL);
    await waitForOpenConnection(socket!);

    if (accessToken != null) {
      await client.Authentication.setAccessToken({ accessToken });
    }

    const { sessionId } = await client.Recording.createSession({ recordingId });

    this._sessionId = sessionId;
    this.sessionWaiter.resolve(sessionId);
    this._threadFront.setSessionId(sessionId);

    return sessionId;
  }

  async findKeyboardEvents(onKeyboardEvents: (events: keyboardEvents) => void) {
    const sessionId = this.getSessionIdThrows();
    client.Session.addKeyboardEventsListener(onKeyboardEvents);
    await client.Session.findKeyboardEvents({}, sessionId!);
    client.Session.removeKeyboardEventsListener(onKeyboardEvents);
  }

  // Allows legacy app to inject Redux source/location data into the client.
  // TODO [bvaughn] This is a stop-gap; we should move this logic into the new architecture somehow.
  injectGetPreferredLocation(getPreferredLocation: GetPreferredLocation) {
    this._injectedGetPreferredLocation = getPreferredLocation;
  }

  async findMessages(onMessage?: (message: Message) => void): Promise<{
    messages: Message[];
    overflow: boolean;
  }> {
    const sessionId = this.getSessionIdThrows();

    const sortedMessages: Message[] = [];

    // TODO This won't work if there are ever overlapping requests.
    // Do we need to implement some kind of locking mechanism to ensure only one read is going at a time?
    client.Console.addNewMessageListener(({ message }) => {
      if (onMessage) {
        onMessage(message);
      }

      const newMessagePoint = message.point.point;

      // Messages may arrive out of order so let's sort them as we get them.
      let lowIndex = 0;
      let highIndex = sortedMessages.length;
      while (lowIndex < highIndex) {
        let middleIndex = (lowIndex + highIndex) >>> 1;
        const message = sortedMessages[middleIndex];

        if (compareNumericStrings(message.point.point, newMessagePoint)) {
          lowIndex = middleIndex + 1;
        } else {
          highIndex = middleIndex;
        }
      }

      const insertAtIndex = lowIndex;

      sortedMessages.splice(insertAtIndex, 0, message);
    });

    const response = await client.Console.findMessages({}, sessionId);

    client.Console.removeNewMessageListener();

    return {
      messages: sortedMessages,
      overflow: response.overflow == true,
    };
  }

  async findMessagesInRange(pointRange: PointRange): Promise<{
    messages: Message[];
    overflow: boolean;
  }> {
    const sessionId = this.getSessionIdThrows();

    // It is important to wait until the range is fully loaded before requesting messages.
    // It would be better if findMessagesInRange errored when the requested range could not be returned,
    // or returned the boundaries of what it did successfully load (see BAC-2536),
    // but right now it will just silently return a subset of messages.
    // Given that we are extra careful here not to to fetch messages in unloaded regions
    // because the result might be invalid (and may get cached by a Suspense caller).
    await this._waitForRangeToBeLoaded(pointRange);

    const response = await client.Console.findMessagesInRange({ range: pointRange }, sessionId);

    // Messages aren't guaranteed to arrive sorted, but unsorted messages aren't that useful to work with.
    // So sort them before returning.
    const sortedMessages = response.messages.sort((messageA: Message, messageB: Message) => {
      const pointA = messageA.point.point;
      const pointB = messageB.point.point;
      return compareNumericStrings(pointA, pointB);
    });

    return {
      messages: sortedMessages,
      overflow: response.overflow == true,
    };
  }

  async findNavigationEvents(onNavigationEvents: (events: navigationEvents) => void) {
    const sessionId = this.getSessionIdThrows();
    client.Session.addNavigationEventsListener(onNavigationEvents);
    await client.Session.findNavigationEvents({}, sessionId!);
    client.Session.removeNavigationEventsListener(onNavigationEvents);
  }

  async findNetworkRequests(
    onRequestsReceived: (data: { requests: RequestInfo[]; events: RequestEventInfo[] }) => void,
    onResponseBodyData: (body: responseBodyData) => void,
    onRequestBodyData: (body: requestBodyData) => void
  ) {
    const sessionId = await this.waitForSession();
    client.Network.addRequestsListener(onRequestsReceived);
    client.Network.addResponseBodyDataListener(onResponseBodyData);
    client.Network.addRequestBodyDataListener(onRequestBodyData);
    await client.Network.findRequests({}, sessionId);
  }

  async findPoints(
    pointSelector: PointSelector,
    pointLimits?: PointPageLimits
  ): Promise<PointDescription[]> {
    const points: PointDescription[] = [];
    const sessionId = this.getSessionIdThrows();
    const findPointsId = String(this.nextFindPointsId++);
    pointLimits = pointLimits ? { ...pointLimits } : {};
    if (!pointLimits.maxCount) {
      pointLimits.maxCount = MAX_POINTS_TO_FIND;
    }

    await this._waitForRangeToBeLoaded(
      pointLimits.begin && pointLimits.end
        ? { begin: pointLimits.begin, end: pointLimits.end }
        : null
    );

    function onPoints(results: findPointsResults) {
      if (results.findPointsId === findPointsId) {
        points.push(...results.points);
      }
    }

    addEventListener("Session.findPointsResults", onPoints);

    let result;
    try {
      result = await client.Session.findPoints(
        { pointSelector, pointLimits, findPointsId },
        sessionId
      );
    } finally {
      removeEventListener("Session.findPointsResults", onPoints);
    }

    if (result.pointPage.hasNext) {
      throw commandError("Too many points", ProtocolError.TooManyPoints);
    }

    points.sort((a, b) => compareNumericStrings(a.point, b.point));
    return points;
  }

  async findSources(): Promise<Source[]> {
    const sources: Source[] = [];

    await this.waitForSession();

    const sessionId = this.getSessionIdThrows();

    const newSourceListener = (source: Source) => {
      sources.push(source);
    };

    client.Debugger.addNewSourceListener(newSourceListener);
    await client.Debugger.findSources({}, sessionId);
    client.Debugger.removeNewSourceListener(newSourceListener);

    this._threadFront.markSourcesLoaded();

    return sources;
  }

  async getAllFrames(pauseId: PauseId): Promise<getAllFramesResult> {
    const sessionId = this.getSessionIdThrows();
    const result = await client.Pause.getAllFrames({}, sessionId, pauseId);
    return result;
  }

  async getTopFrame(pauseId: PauseId): Promise<getTopFrameResult> {
    const sessionId = this.getSessionIdThrows();
    const result = await client.Pause.getTopFrame({}, sessionId, pauseId);
    return result;
  }

  async getAnnotationKinds(): Promise<string[]> {
    const sessionId = this.getSessionIdThrows();
    const { kinds } = await client.Session.getAnnotationKinds({}, sessionId);
    return kinds;
  }

  async getEventCountForTypes(
    eventTypes: string[],
    range: PointRange | null
  ): Promise<Record<string, number>> {
    const sessionId = this.getSessionIdThrows();
    const { counts } = await client.Debugger.getEventHandlerCounts(
      { eventTypes, range: range ?? undefined },
      sessionId
    );
    return Object.fromEntries(counts.map(({ type, count }) => [type, count]));
  }

  async getAllEventHandlerCounts(range: PointRange | null): Promise<Record<string, number>> {
    const sessionId = this.getSessionIdThrows();
    const { counts } = await client.Debugger.getAllEventHandlerCounts(
      { range: range ?? undefined },
      sessionId
    );
    const countsObject = Object.fromEntries(counts.map(({ type, count }) => [type, count]));
    return countsObject;
  }

  getExceptionValue(pauseId: PauseId): Promise<getExceptionValueResult> {
    const sessionId = this.getSessionIdThrows();
    return client.Pause.getExceptionValue({}, sessionId, pauseId);
  }

  async getFocusWindow(): Promise<TimeStampedPointRange> {
    const sessionId = this.getSessionIdThrows();
    const { window } = await client.Session.getFocusWindow({}, sessionId);
    return window;
  }

  async getFrameSteps(pauseId: PauseId, frameId: FrameId): Promise<PointDescription[]> {
    const sessionId = this.getSessionIdThrows();
    const { steps } = await client.Pause.getFrameSteps({ frameId }, sessionId, pauseId);
    return steps;
  }

  async getObjectProperty(
    objectId: ObjectId,
    pauseId: PauseId,
    propertyName: string
  ): Promise<Result> {
    const sessionId = this.getSessionIdThrows();
    const { result } = await client.Pause.getObjectProperty(
      {
        object: objectId,
        name: propertyName,
      },
      sessionId,
      pauseId
    );
    return result;
  }

  async getObjectWithPreview(
    objectId: ObjectId,
    pauseId: PauseId,
    level?: ObjectPreviewLevel
  ): Promise<PauseData> {
    const sessionId = this.getSessionIdThrows();
    const result = await client.Pause.getObjectPreview(
      { level, object: objectId },
      sessionId,
      pauseId || undefined
    );
    return result.data;
  }

  async getPointNearTime(time: number): Promise<TimeStampedPoint> {
    const sessionId = this.getSessionIdThrows();

    const { point } = await client.Session.getPointNearTime({ time }, sessionId);
    return point;
  }

  async getPointsBoundingTime(time: number): Promise<PointsBoundingTime> {
    const sessionId = this.getSessionIdThrows();

    const result = await client.Session.getPointsBoundingTime({ time }, sessionId);
    return result;
  }

  getCorrespondingLocations(location: Location): Location[] {
    const { column, line, sourceId } = location;
    const sourceIds = this.getCorrespondingSourceIds(sourceId);
    return sourceIds.map(sourceId => ({
      column,
      line,
      sourceId,
    }));
  }

  getCorrespondingSourceIds(sourceId: SourceId): SourceId[] {
    return this._threadFront.getCorrespondingSourceIds(sourceId);
  }

  getPreferredLocation(locations: Location[]): Location | null {
    if (this._injectedGetPreferredLocation != null) {
      return this._injectedGetPreferredLocation(locations);
    }

    return locations[0] || null;
  }

  getRecordingId(): RecordingId | null {
    return this._recordingId;
  }

  async getScope(pauseId: PauseId, scopeId: ScopeId): Promise<getScopeResult> {
    const sessionId = this.getSessionIdThrows();
    const result = await client.Pause.getScope({ scope: scopeId }, sessionId, pauseId);
    return result;
  }

  async getScopeMap(location: Location): Promise<VariableMapping[] | undefined> {
    const sessionId = this.getSessionIdThrows();
    const { map } = await client.Debugger.getScopeMap({ location }, sessionId);
    return map;
  }

  async getScreenshot(point: ExecutionPoint): Promise<ScreenShot> {
    const sessionId = this.getSessionIdThrows();
    const { screen } = await client.Graphics.getPaintContents(
      { point, mimeType: "image/jpeg" },
      sessionId
    );
    return screen;
  }

  async mapExpressionToGeneratedScope(expression: string, location: Location): Promise<string> {
    const sessionId = this.getSessionIdThrows();
    const result = await client.Debugger.mapExpressionToGeneratedScope(
      { expression, location },
      sessionId
    );
    return result.expression;
  }

  async getSessionEndpoint(): Promise<TimeStampedPoint> {
    const sessionId = this.getSessionIdThrows();
    const { endpoint } = await client.Session.getEndpoint({}, sessionId);
    return endpoint;
  }

  getSessionId(): SessionId | null {
    return this._sessionId;
  }

  async getSourceHitCounts(
    sourceId: SourceId,
    locations: SameLineSourceLocations[],
    focusRange: PointRange | null
  ) {
    const sessionId = this.getSessionIdThrows();
    await this._waitForRangeToBeLoaded(focusRange);
    const { hits } = await client.Debugger.getHitCounts(
      { sourceId, locations, maxHits: TOO_MANY_POINTS_TO_FIND, range: focusRange || undefined },
      sessionId
    );
    return hits;
  }

  getSourceOutline(sourceId: SourceId) {
    return client.Debugger.getSourceOutline({ sourceId }, this.getSessionIdThrows());
  }

  async getBreakpointPositions(
    sourceId: SourceId,
    locationRange: SourceLocationRange | null
  ): Promise<SameLineSourceLocations[]> {
    const sessionId = this.getSessionIdThrows();
    const begin = locationRange ? locationRange.start : undefined;
    const end = locationRange ? locationRange.end : undefined;

    let { lineLocations } = await client.Debugger.getPossibleBreakpoints(
      { sourceId: sourceId, begin, end },
      sessionId
    );

    // Ensure breakpoint positions are sorted by line ascending
    lineLocations!.sort((a, b) => a.line - b.line);

    return lineLocations!;
  }

  async getMappedLocation(location: Location): Promise<MappedLocation> {
    const sessionId = this.getSessionIdThrows();
    const { mappedLocation } = await client.Debugger.getMappedLocation({ location }, sessionId);
    return mappedLocation;
  }

  async requestFocusRange(range: FocusWindowRequest): Promise<TimeStampedPointRange> {
    const sessionId = this.getSessionIdThrows();
    const { window } = await client.Session.requestFocusRange({ range }, sessionId);

    return window;
  }

  isOriginalSource(sourceId: SourceId): boolean {
    return this._threadFront.isOriginalSource(sourceId);
  }

  isPrettyPrintedSource(sourceId: SourceId): boolean {
    return this._threadFront.isPrettyPrintedSource(sourceId);
  }

  removeEventListener(type: ReplayClientEvents, handler: Function): void {
    if (this._eventHandlers.has(type)) {
      const handlers = this._eventHandlers.get(type)!;
      const index = handlers.indexOf(handler);
      if (index >= 0) {
        handlers.splice(index, 1);
      }
    }
  }

  repaintGraphics(pauseId: PauseId): Promise<repaintGraphicsResult> {
    const sessionId = this.getSessionIdThrows();
    return client.DOM.repaintGraphics({}, sessionId, pauseId);
  }

  /**
   * Matches can be streamed in over time, so we need to support a callback that can receive them incrementally
   */
  async searchFunctions(
    {
      query,
      sourceIds,
    }: {
      query: string;
      sourceIds?: string[];
    },
    onMatches: (matches: FunctionMatch[]) => void
  ): Promise<void> {
    const sessionId = this.getSessionIdThrows();
    const thisSearchUniqueId = uniqueId("search-fns-");

    let pendingMatches: FunctionMatch[] = [];

    // It's important to buffer the chunks before passing them along to subscribers.
    // The backend decides how big each streaming chunk should be,
    // but if chunks are too small (and events are too close together)
    // then we may schedule too many updates with React and causing a lot of memory pressure.
    const onMatchesThrottled = throttle(() => {
      onMatches(pendingMatches);
      pendingMatches = [];
    }, STREAMING_THROTTLE_DURATION);

    const matchesListener = ({ searchId, matches }: functionsMatches) => {
      if (searchId === thisSearchUniqueId) {
        pendingMatches = pendingMatches.concat(matches);
        onMatchesThrottled();
      }
    };

    client.Debugger.addFunctionsMatchesListener(matchesListener);
    try {
      await client.Debugger.searchFunctions(
        { searchId: thisSearchUniqueId, sourceIds, query },
        sessionId
      );
    } finally {
      client.Debugger.removeFunctionsMatchesListener(matchesListener);
    }

    // Because the matches callback is throttled, we may still have a bit of
    // leftover data that hasn't been handled yet, even though the server API
    // promise has resolved. Delay-loop until that's done, so that the logic
    // that called this method knows when it's safe to continue.
    while (pendingMatches.length > 0) {
      await waitForTime(10);
    }
  }

  /**
   * Matches can be streamed in over time, so we need to support a callback that can receive them incrementally
   */
  async searchSources(
    {
      limit,
      query,
      sourceIds,
    }: {
      limit?: number;
      query: string;
      sourceIds?: string[];
    },
    onMatches: (matches: SearchSourceContentsMatch[], didOverflow: boolean) => void
  ): Promise<void> {
    const sessionId = this.getSessionIdThrows();
    const thisSearchUniqueId = uniqueId("search-sources-");

    let didOverflow = false;
    let pendingMatches: SearchSourceContentsMatch[] = [];
    let pendingThrottlePromise: Promise<void> | null = null;
    let resolvePendingThrottlePromise: Function | null = null;

    // It's important to buffer the chunks before passing them along to subscribers.
    // The backend decides how big each streaming chunk should be,
    // but if chunks are too small (and events are too close together)
    // then we may schedule too many updates with React and causing a lot of memory pressure.
    const onMatchesThrottled = throttle(() => {
      onMatches(pendingMatches, didOverflow);
      pendingMatches = [];

      if (resolvePendingThrottlePromise !== null) {
        resolvePendingThrottlePromise();
        pendingThrottlePromise = null;
      }
    }, STREAMING_THROTTLE_DURATION);

    const matchesListener = ({ matches, overflow, searchId }: searchSourceContentsMatches) => {
      if (searchId === thisSearchUniqueId) {
        didOverflow ||= overflow;
        pendingMatches = pendingMatches.concat(matches);

        if (pendingThrottlePromise === null) {
          pendingThrottlePromise = new Promise(resolve => {
            resolvePendingThrottlePromise = resolve;
          });
        }

        onMatchesThrottled();
      }
    };

    client.Debugger.addSearchSourceContentsMatchesListener(matchesListener);
    try {
      await client.Debugger.searchSourceContents(
        { limit, searchId: thisSearchUniqueId, sourceIds, query },
        sessionId
      );

      // Don't resolve the outer Promise until the last chunk has been processed.
      if (pendingThrottlePromise !== null) {
        await pendingThrottlePromise;
      }
    } finally {
      client.Debugger.removeSearchSourceContentsMatchesListener(matchesListener);
    }
  }

  async runEvaluation(
    opts: {
      selector: PointSelector;
      expression: string;
      frameIndex?: number;
      fullPropertyPreview?: boolean;
      limits?: PointPageLimits;
    },
    onResults: (results: RunEvaluationResult[]) => void
  ): Promise<void> {
    const sessionId = this.getSessionIdThrows();
    const runEvaluationId = String(this.nextRunEvaluationId++);
    const pointLimits: PointPageLimits = opts.limits ? { ...opts.limits } : {};
    if (!pointLimits.maxCount) {
      pointLimits.maxCount = MAX_POINTS_TO_RUN_EVALUATION;
    }

    await this._waitForRangeToBeLoaded(
      pointLimits.begin && pointLimits.end
        ? { begin: pointLimits.begin, end: pointLimits.end }
        : null
    );

    function onResultsWrapper(results: runEvaluationResults) {
      if (results.runEvaluationId === runEvaluationId) {
        onResults(results.results);
      }
    }

    addEventListener("Session.runEvaluationResults", onResultsWrapper);

    let result;
    try {
      result = await client.Session.runEvaluation(
        {
          expression: opts.expression,
          frameIndex: opts.frameIndex,
          fullReturnedPropertyPreview: opts.fullPropertyPreview,
          pointLimits,
          pointSelector: opts.selector,
          runEvaluationId,
        },
        sessionId
      );
    } finally {
      removeEventListener("Session.runEvaluationResults", onResultsWrapper);
    }

    if (result.pointPage.hasNext) {
      throw commandError("Too many points", ProtocolError.TooManyPoints);
    }
  }

  async streamSourceContents(
    sourceId: SourceId,
    onSourceContentsInfo: (params: sourceContentsInfo) => void,
    onSourceContentsChunk: (params: sourceContentsChunk) => void
  ): Promise<void> {
    const sessionId = this.getSessionIdThrows();

    let pendingChunk = "";
    let pendingThrottlePromise: Promise<void> | null = null;
    let resolvePendingThrottlePromise: Function | null = null;

    const callSourceContentsChunkThrottled = throttle(() => {
      onSourceContentsChunk({ chunk: pendingChunk, sourceId });
      pendingChunk = "";

      if (resolvePendingThrottlePromise !== null) {
        resolvePendingThrottlePromise();
        pendingThrottlePromise = null;
      }
    }, STREAMING_THROTTLE_DURATION);

    const onSourceContentsChunkWrapper = (params: sourceContentsChunk) => {
      // It's important to buffer the chunks before passing them along to subscribers.
      // The backend decides how much text to send in each chunk,
      // but if chunks are too small (and events are too close together)
      // then we may schedule too many updates with React and causing a lot of memory pressure.
      if (params.sourceId === sourceId) {
        pendingChunk += params.chunk;

        if (pendingThrottlePromise === null) {
          pendingThrottlePromise = new Promise(resolve => {
            resolvePendingThrottlePromise = resolve;
          });
        }

        callSourceContentsChunkThrottled();
      }
    };

    const onSourceContentsInfoWrapper = (params: sourceContentsInfo) => {
      if (params.sourceId === sourceId) {
        onSourceContentsInfo(params);
      }
    };

    try {
      client.Debugger.addSourceContentsChunkListener(onSourceContentsChunkWrapper);
      client.Debugger.addSourceContentsInfoListener(onSourceContentsInfoWrapper);

      await client.Debugger.streamSourceContents({ sourceId }, sessionId);

      // Don't resolve the outer Promise until the last chunk has been processed.
      if (pendingThrottlePromise !== null) {
        await pendingThrottlePromise;
      }
    } finally {
      client.Debugger.removeSourceContentsChunkListener(onSourceContentsChunkWrapper);
      client.Debugger.removeSourceContentsInfoListener(onSourceContentsInfoWrapper);
    }
  }

  async _waitForPointToBeLoaded(point: ExecutionPoint): Promise<void> {
    return new Promise(resolve => {
      const checkLoaded = () => {
        const loadedRegions = this.loadedRegions;
        let isLoaded = false;
        if (loadedRegions !== null) {
          isLoaded = isPointInRegions(point, loadedRegions.loaded);
        }

        if (isLoaded) {
          resolve();

          this.removeEventListener("loadedRegionsChange", checkLoaded);
        }
      };

      this.addEventListener("loadedRegionsChange", checkLoaded);

      checkLoaded();
    });
  }

  async _waitForRangeToBeLoaded(
    focusRange: TimeStampedPointRange | PointRange | null
  ): Promise<void> {
    return new Promise(resolve => {
      const checkLoaded = () => {
        const loadedRegions = this.loadedRegions;
        let isLoaded = false;
        if (loadedRegions !== null && loadedRegions.loading.length > 0) {
          if (focusRange !== null) {
            isLoaded = isRangeInRegions(focusRange, loadedRegions.indexed);
          } else {
            isLoaded = areRangesEqual(loadedRegions.indexed, loadedRegions.loading);
          }
        }

        if (isLoaded) {
          resolve();

          this.removeEventListener("loadedRegionsChange", checkLoaded);
        }
      };

      this.addEventListener("loadedRegionsChange", checkLoaded);

      checkLoaded();
    });
  }

  async waitForTimeToBeLoaded(time: number): Promise<void> {
    return new Promise(resolve => {
      const checkLoaded = () => {
        const loadedRegions = this.loadedRegions;
        let isLoaded = false;
        if (loadedRegions !== null) {
          isLoaded = isTimeInRegions(time, loadedRegions.loaded);
        }

        if (isLoaded) {
          resolve();

          this.removeEventListener("loadedRegionsChange", checkLoaded);
        }
      };

      this.addEventListener("loadedRegionsChange", checkLoaded);

      checkLoaded();
    });
  }

  async waitForLoadedSources(): Promise<void> {
    await this._threadFront.ensureAllSources();
  }

  _dispatchEvent(type: ReplayClientEvents, ...args: any[]): void {
    const handlers = this._eventHandlers.get(type);
    if (handlers) {
      // we iterate over a copy of the handlers array because the array
      // may be modified during the iteration by one of the handlers
      [...handlers].forEach(handler => handler(...args));
    }
  }

  _onLoadChanges = (loadedRegions: LoadedRegions) => {
    this._loadedRegions = loadedRegions;

    this._dispatchEvent("loadedRegionsChange", loadedRegions);
  };
}

function waitForOpenConnection(
  socket: WebSocket,
  maxDurationMs = 5000,
  intervalMs = 100
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const startTime = performance.now();
    const intervalId = setInterval(() => {
      if (performance.now() - startTime > maxDurationMs) {
        clearInterval(intervalId);
        reject(new Error("Timed out"));
      } else if (socket.readyState === socket.OPEN) {
        clearInterval(intervalId);
        resolve();
      }
    }, intervalMs);
  });
}
