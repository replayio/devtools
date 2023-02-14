import {
  BreakpointId,
  Result as EvaluationResult,
  ExecutionPoint,
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
  PointRange,
  getPointsBoundingTimeResult as PointsBoundingTime,
  RecordingId,
  Result,
  SameLineSourceLocations,
  ScopeId,
  SearchSourceContentsMatch,
  SessionId,
  newSource as Source,
  SourceId,
  TimeRange,
  TimeStampedPoint,
  TimeStampedPointRange,
  VariableMapping,
  createPauseResult,
  functionsMatches,
  getAllFramesResult,
  getScopeResult,
  keyboardEvents,
  navigationEvents,
  repaintGraphicsResult,
  requestFocusRangeResult,
  searchSourceContentsMatches,
  sourceContentsChunk,
  sourceContentsInfo,
} from "@replayio/protocol";
import throttle from "lodash/throttle";
import uniqueId from "lodash/uniqueId";

import analysisManager, { MAX_POINTS_FOR_FULL_ANALYSIS } from "protocol/analysisManager";
// eslint-disable-next-line no-restricted-imports
import { client, initSocket } from "protocol/socket";
import { ThreadFront } from "protocol/thread";
import { RecordingCapabilities } from "protocol/thread/thread";
import { binarySearch, compareNumericStrings, defer, waitForTime } from "protocol/utils";
import { initProtocolMessagesStore } from "replay-next/components/protocol/ProtocolMessagesStore";
import { getBreakpointPositionsAsync } from "replay-next/src/suspense/SourcesCache";
import { insert } from "replay-next/src/utils/array";
import { areRangesEqual, compareExecutionPoints } from "replay-next/src/utils/time";
import { TOO_MANY_POINTS_TO_FIND } from "shared/constants";
import { ProtocolError, isCommandError } from "shared/utils/error";
import { isPointInRegions, isRangeInRegions, isTimeInRegions } from "shared/utils/time";

import {
  HitPointStatus,
  HitPointsAndStatusTuple,
  LineNumberToHitCountMap,
  ReplayClientEvents,
  ReplayClientInterface,
  RunAnalysisParams,
  SourceLocationRange,
} from "./types";

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

  constructor(dispatchURL: string, threadFront: typeof ThreadFront) {
    this._dispatchURL = dispatchURL;
    this._threadFront = threadFront;

    this._threadFront.listenForLoadChanges(this._onLoadChanges);

    analysisManager.init();
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

  async getRecordingCapabilities(): Promise<RecordingCapabilities> {
    return this._threadFront.getRecordingCapabilities();
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
    this._threadFront.setSessionId(sessionId, {});

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

  async findMessages(focusRange: TimeStampedPointRange | null): Promise<{
    messages: Message[];
    overflow: boolean;
  }> {
    const sessionId = this.getSessionIdThrows();

    if (focusRange !== null) {
      // We *only* care about loaded regions when calling `findMessagesInRange`.
      // Calling `findMessages` is always safe and always returns the console
      // messages for all parts of the recording, regardless of what is
      // currently loading or loaded. The reason we sometimes use
      // `findMessagesInRange` is because `findMessages` can overflow (if the
      // replay contains more than 1,000 console messages). In that case, we
      // might be able to fetch all of the console messages for a particular
      // section by using `findMessagesInRange`, but it requires sending
      // manifests to a running process, so it will only work in loaded regions.

      // It would be better if `findMessagesInRange` either errored when the
      // requested range could not be returned, or returned the boundaries of
      // what it *did* successfully load (see BAC-2536), but right now it will
      // just silently return a subset of messages. Given that we are extra
      // careful here not to to fetch messages in unloaded regions because the
      // result might be invalid (and may get cached by a Suspense caller).
      await this._waitForRangeToBeLoaded(focusRange);

      const response = await client.Console.findMessagesInRange(
        { range: { begin: focusRange.begin.point, end: focusRange.end.point } },
        sessionId
      );

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
    } else {
      const sortedMessages: Message[] = [];

      // TODO This won't work if there are every overlapping requests.
      // Do we need to implement some kind of locking mechanism to ensure only one read is going at a time?
      client.Console.addNewMessageListener(({ message }) => {
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
  }

  async findNavigationEvents(onNavigationEvents: (events: navigationEvents) => void) {
    const sessionId = this.getSessionIdThrows();
    client.Session.addNavigationEventsListener(onNavigationEvents);
    await client.Session.findNavigationEvents({}, sessionId!);
    client.Session.removeNavigationEventsListener(onNavigationEvents);
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

  async getAnnotationKinds(): Promise<string[]> {
    const sessionId = this.getSessionIdThrows();
    const { kinds } = await client.Session.getAnnotationKinds({}, sessionId);
    return kinds;
  }

  async getEventCountForTypes(eventTypes: string[]): Promise<Record<string, number>> {
    const sessionId = this.getSessionIdThrows();
    const { counts }: { counts: { type: string; count: number }[] } =
      await client.Debugger.getEventHandlerCounts({ eventTypes }, sessionId);
    const countsObject = Object.fromEntries(counts.map(({ type, count }) => [type, count]));
    return countsObject;
  }

  async getFrameSteps(pauseId: PauseId, frameId: FrameId): Promise<PointDescription[]> {
    const sessionId = this.getSessionIdThrows();
    const { steps } = await client.Pause.getFrameSteps({ frameId }, sessionId, pauseId);
    return steps;
  }

  async getHitPointsForLocation(
    focusRange: TimeStampedPointRange | null,
    location: Location,
    condition: string | null
  ): Promise<HitPointsAndStatusTuple> {
    const collectedHitPoints: TimeStampedPoint[] = [];
    let status: HitPointStatus | null = null;

    // Don't try to fetch hit points in unloaded regions.
    // The result might be invalid (and may get cached by a Suspense caller).
    await this._waitForRangeToBeLoaded(focusRange);

    const locations = this.getCorrespondingLocations(location).map(location => ({ location }));
    await Promise.all(
      locations.map(location => getBreakpointPositionsAsync(this, location.location.sourceId))
    );

    // The backend doesn't support filtering hit points by condition, so we fall back to running analysis.
    // This is less efficient so we only do it if we have a condition.
    // We should delete this once the backend supports filtering (see BAC-2103).
    if (condition) {
      const mapper = `
        const { point, time } = input;
        const { frame: frameId } = sendCommand("Pause.getTopFrame");

        const { result: conditionResult } = sendCommand(
          "Pause.evaluateInFrame",
          { frameId, expression: ${JSON.stringify(condition)}, useOriginalScopes: true }
        );

        let result;
        if (conditionResult.returned) {
          const { returned } = conditionResult;
          if ("value" in returned && !returned.value) {
            result = 0;
          } else if (!Object.keys(returned).length) {
            // Undefined.
            result = 0;
          } else {
            result = 1;
          }
        } else {
          result = 1;
        }

        return [
          {
            key: point,
            value: {
              match: result,
              point,
              time,
            },
          },
        ];
      `;

      try {
        await analysisManager.runAnalysis(
          {
            effectful: false,
            locations,
            mapper,
            range: focusRange
              ? { begin: focusRange.begin.point, end: focusRange.end.point }
              : undefined,
          },
          {
            onAnalysisError: (error: unknown) => {
              if (isCommandError(error, ProtocolError.TooManyPoints)) {
                status = "too-many-points-to-find";
              } else {
                console.error(error);

                status = "unknown-error";
              }
            },
            onAnalysisResult: results => {
              results.forEach(({ value }) => {
                if (value.match) {
                  const timeStampedPoint = {
                    point: value.point,
                    time: value.time,
                  };
                  insert<TimeStampedPoint>(collectedHitPoints, timeStampedPoint, (a, b) =>
                    compareExecutionPoints(a.point, b.point)
                  );
                }
              });
            },
          }
        );
      } catch (error) {
        if (isCommandError(error, ProtocolError.TooManyPoints)) {
          status = "too-many-points-to-find";
        } else {
          console.error(error);

          status = "unknown-error";
        }
      }
    } else {
      try {
        await analysisManager.runAnalysis(
          {
            effectful: false,
            locations,
            mapper: "",
            range: focusRange
              ? { begin: focusRange.begin.point, end: focusRange.end.point }
              : undefined,
          },
          {
            onAnalysisError: (error: unknown) => {
              if (isCommandError(error, ProtocolError.TooManyPoints)) {
                status = "too-many-points-to-find";
              } else {
                throw error;
              }
            },
            onAnalysisPoints: (pointDescriptions: PointDescription[]) => {
              pointDescriptions.forEach(timeStampedPoint => {
                insert<TimeStampedPoint>(collectedHitPoints, timeStampedPoint, (a, b) =>
                  compareExecutionPoints(a.point, b.point)
                );
              });
            },
          }
        );
      } catch (error) {
        if (isCommandError(error, ProtocolError.TooManyPoints)) {
          status = "too-many-points-to-find";
        } else {
          console.error(error);

          status = "unknown-error";
        }
      }
    }

    if (status == null) {
      if (collectedHitPoints.length > MAX_POINTS_FOR_FULL_ANALYSIS) {
        status = "too-many-points-to-run-analysis";
      } else {
        status = "complete";
      }
    }

    return [collectedHitPoints, status];
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

  async getSessionEndpoint(sessionId: SessionId): Promise<TimeStampedPoint> {
    const { endpoint } = await client.Session.getEndpoint({}, sessionId);
    return endpoint;
  }

  getSessionId(): SessionId | null {
    return this._sessionId;
  }

  async getSourceHitCounts(
    sourceId: SourceId,
    locationRange: SourceLocationRange,
    sortedSourceLocations: SameLineSourceLocations[],
    focusRange: PointRange | null
  ): Promise<LineNumberToHitCountMap> {
    const sessionId = this.getSessionIdThrows();

    // Don't try to fetch hit counts in unloaded regions.
    // The result might be invalid (and may get cached by a Suspense caller).
    await this._waitForRangeToBeLoaded(focusRange);

    // The protocol returns possible breakpoints for the entire source,
    // but for large sources this can result in "too many locations" to run hit counts.
    // To avoid this, we limit the number of lines we request hit count information for.
    //
    // Note that since this is a sorted array, we can do better than a plain .filter() for performance.
    const startLine = locationRange.start.line;
    const startIndex = binarySearch(
      0,
      sortedSourceLocations.length,
      (index: number) => startLine - sortedSourceLocations[index].line
    );
    const endLine = locationRange.end.line;
    const stopIndex = binarySearch(
      startIndex,
      sortedSourceLocations.length,
      (index: number) => endLine - sortedSourceLocations[index].line
    );

    const firstColumnLocations = sortedSourceLocations
      .slice(startIndex, stopIndex + 1)
      .map(location => ({
        ...location,
        columns: location.columns.slice(0, 1),
      }));
    const correspondingSourceIds = this.getCorrespondingSourceIds(sourceId);

    const hitCounts: LineNumberToHitCountMap = new Map();

    await Promise.all(
      correspondingSourceIds.map(async sourceId => {
        const { hits: protocolHitCounts } = await client.Debugger.getHitCounts(
          {
            sourceId,
            locations: firstColumnLocations,
            maxHits: TOO_MANY_POINTS_TO_FIND,
            range: focusRange || undefined,
          },
          sessionId
        );

        const lines: Set<number> = new Set();

        // Sum hits across corresponding sources,
        // But only record the first column's hits for any given line in a source.
        protocolHitCounts.forEach(({ hits, location }) => {
          const { line } = location;
          if (!lines.has(line)) {
            lines.add(line);

            const previous = hitCounts.get(line) || 0;
            if (previous) {
              hitCounts.set(line, {
                count: previous.count + hits,
                firstBreakableColumnIndex: previous.firstBreakableColumnIndex,
              });
            } else {
              hitCounts.set(line, {
                count: hits,
                firstBreakableColumnIndex: location.column,
              });
            }
          }
        });

        return hitCounts;
      })
    );

    return hitCounts;
  }

  async getBreakpointPositions(
    sourceId: SourceId,
    locationRange: SourceLocationRange | null
  ): Promise<SameLineSourceLocations[]> {
    const sessionId = this.getSessionIdThrows();
    const begin = locationRange ? locationRange.start : undefined;
    const end = locationRange ? locationRange.end : undefined;

    let lineLocations: SameLineSourceLocations[] | null = null;

    // Breakpoint positions must be loaded for all sources,
    // else future API calls for things like hit counts will fail with "invalid location"
    // See BAC-2370
    const correspondingSourceIds = this.getCorrespondingSourceIds(sourceId);
    await Promise.all(
      correspondingSourceIds.map(async currentSourceId => {
        const { lineLocations: currentLineLocations } =
          await client.Debugger.getPossibleBreakpoints(
            { sourceId: currentSourceId, begin, end },
            sessionId
          );

        if (currentSourceId === sourceId) {
          lineLocations = currentLineLocations;
        }
      })
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

  async requestFocusRange(range: TimeRange): Promise<requestFocusRangeResult> {
    const sessionId = this.getSessionIdThrows();
    const result = await client.Session.requestFocusRange({ range }, sessionId);

    return result;
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

  async runAnalysis<Result>(params: RunAnalysisParams): Promise<Result[]> {
    // Don't try to run analysis in unloaded regions.
    // The result might be invalid (and may get cached by a Suspense caller).
    await this._waitForRangeToBeLoaded(params.range || null);

    return new Promise<Result[]>(async (resolve, reject) => {
      const results: Result[] = [];

      const { location, ...rest } = params;

      let locations;
      if (location) {
        locations = this.getCorrespondingLocations(location).map(location => ({ location }));
        await Promise.all(
          locations.map(location => getBreakpointPositionsAsync(this, location.location.sourceId))
        );
      }

      const analysisParams = {
        ...rest,
        locations,
      };

      try {
        await analysisManager.runAnalysis(analysisParams, {
          onAnalysisError: (error: unknown) => {
            reject(error);
          },
          onAnalysisResult: analysisEntries => {
            results.push(...analysisEntries.map(entry => entry.value));
          },
        });

        resolve(results);
      } catch (error) {
        reject(error);
      }
    });
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
