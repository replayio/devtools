import {
  Result as EvaluationResult,
  ExecutionPoint,
  FrameId,
  FunctionMatch,
  KeyboardEvent,
  loadedRegions as LoadedRegions,
  Location,
  MappedLocation,
  Message,
  MouseEvent,
  NavigationEvent,
  ObjectId,
  ObjectPreviewLevel,
  PauseData,
  PauseDescription,
  PauseId,
  PointDescription,
  PointPageLimits,
  PointRange,
  PointRangeFocusRequest,
  PointSelector,
  PointStackFrame,
  getPointsBoundingTimeResult as PointsBoundingTime,
  RecordingId,
  RequestBodyData,
  requestBodyData as RequestBodyDataEvent,
  RequestEventInfo,
  RequestId,
  RequestInfo,
  requests as Requests,
  ResponseBodyData,
  responseBodyData as ResponseBodyDataEvent,
  Result,
  RunEvaluationPreload,
  RunEvaluationResult,
  SameLineSourceLocations,
  ScopeId,
  ScreenShot,
  SearchSourceContentsMatch,
  SessionId,
  Source,
  SourceId,
  TimeStampedPoint,
  TimeStampedPointRange,
  VariableMapping,
  annotations,
  createPauseResult,
  findPointsResults,
  functionsMatches,
  getAllBoundingClientRectsResult,
  getAllFramesResult,
  getAppliedRulesResult,
  getBoundingClientRectResult,
  getBoxModelResult,
  getComputedStyleResult,
  getDocumentResult,
  getEventListenersResult,
  getExceptionValueResult,
  getParentNodesResult,
  getScopeResult,
  getTopFrameResult,
  keyboardEvents,
  mouseEvents,
  navigationEvents,
  newSources,
  paintPoints,
  performSearchResult,
  querySelectorResult,
  repaintGraphicsResult,
  runEvaluationResults,
  searchSourceContentsMatches,
  sourceContentsChunk,
  sourceContentsInfo,
} from "@replayio/protocol";
import throttle from "lodash/throttle";
import uniqueId from "lodash/uniqueId";

// eslint-disable-next-line no-restricted-imports
import { addEventListener, client, initSocket, sendMessage, removeEventListener } from "protocol/socket";
import { assert, compareExecutionPoints, defer, waitForTime, transformSupplementalId, breakdownSupplementalId } from "protocol/utils";
import { initProtocolMessagesStore } from "replay-next/components/protocol/ProtocolMessagesStore";
import { insert } from "replay-next/src/utils/array";
import { TOO_MANY_POINTS_TO_FIND } from "shared/constants";
import { ProtocolError, commandError } from "shared/utils/error";
import { isPointInRegion, isRangeInRegions } from "shared/utils/time";

import {
  AnnotationListener,
  ReplayClientEvents,
  ReplayClientInterface,
  SourceLocationRange,
  SupplementalSession,
  SupplementalRecordingConnection,
  TimeStampedPointWithPaintHash,
} from "./types";

export const MAX_POINTS_TO_FIND = 10_000;
export const MAX_POINTS_TO_RUN_EVALUATION = 500;

const STREAMING_THROTTLE_DURATION = 100;

// TODO How should the client handle concurrent requests?
// Should we force serialization?
// Should we cancel in-flight requests and start new ones?

export class ReplayClient implements ReplayClientInterface {
  private _dispatchURL: string;
  private _eventHandlers: Map<ReplayClientEvents, Function[]> = new Map();
  private _loadedRegions: LoadedRegions | null = null;
  private _recordingId: RecordingId | null = null;
  private _sessionId: SessionId | null = null;

  private sessionWaiter = defer<SessionId>();

  private supplemental: SupplementalSession[] = [];
  private supplementalTimeDeltas: (number | undefined)[] = [];

  private pauseIdToSessionId = new Map<string, string>();

  private focusWindow: TimeStampedPointRange | null = null;

  private nextFindPointsId = 1;
  private nextRunEvaluationId = 1;

  private annotationListeners = new Map<string, AnnotationListener>();

  constructor(dispatchURL: string) {
    this._dispatchURL = dispatchURL;

    this.waitForSession().then(async sessionId => {
      client.Session.addLoadedRegionsListener(this._onLoadChanges);
      client.Session.listenForLoadChanges({}, sessionId);

      client.Session.addAnnotationsListener(this.onAnnotations);
    });
  }
  // Configures the client to use an already initialized session iD.
  // This method should be used for apps that use the protocol package directly.
  // Apps that only communicate with the Replay protocol through this client should use the initialize method instead.
  async configure(recordingId: string, sessionId: string, supplemental: SupplementalSession[]): Promise<void> {
    this._recordingId = recordingId;
    this._sessionId = sessionId;
    this._dispatchEvent("sessionCreated");
    this.sessionWaiter.resolve(sessionId);
    this.supplemental.push(...supplemental);
    for (const supplementalSession of supplemental) {
      const timeDelta = computeSupplementalTimeDelta(recordingId, supplementalSession);
      this.supplementalTimeDeltas.push(timeDelta);
    }
    await this.syncFocusWindow();
  }

  waitForSession() {
    return this.sessionWaiter.promise;
  }

  isMainSession(sessionId: string) {
    assert(this._sessionId);
    return sessionId == this._sessionId;
  }

  numSupplementalRecordings() {
    return this.supplemental.length;
  }

  private async forEachSession(callback: (sessionId: string, supplementalIndex: number) => Promise<void>) {
    const sessionId = await this.waitForSession();
    await callback(sessionId, 0);
    for (let i = 0; i < this.supplemental.length; i++) {
      await callback(this.supplemental[i].sessionId, i + 1);
    }
  }

  private async getSupplementalIndexSession(supplementalIndex: number) {
    if (!supplementalIndex) {
      return this.waitForSession();
    }
    const supplementalInfo = this.supplemental[supplementalIndex - 1];
    assert(supplementalInfo);
    return supplementalInfo.sessionId;
  }

  private async breakdownSupplementalIdAndSession(transformedId: string): Promise<{ id: string, sessionId: string, supplementalIndex: number }> {
    const { id, supplementalIndex } = breakdownSupplementalId(transformedId);
    const sessionId = await this.getSupplementalIndexSession(supplementalIndex);
    return { id, sessionId, supplementalIndex };
  }

  private async getPauseSessionId(pauseId: string): Promise<string> {
    const sessionId = this.pauseIdToSessionId.get(pauseId);
    return sessionId || await this.waitForSession();
  }

  private getSessionIdSupplementalIndex(sessionId: string) {
    for (let i = 0; i < this.supplemental.length; i++) {
      if (sessionId == this.supplemental[i].sessionId) {
        return i + 1;
      }
    }
    return 0;
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

  async getBuildId(): Promise<string> {
    const sessionId = await this.waitForSession();
    const { buildId } = await client.Session.getBuildId({}, sessionId);
    return buildId;
  }

  async createPause(transformedExecutionPoint: ExecutionPoint): Promise<createPauseResult> {
    const { id: executionPoint, sessionId } = await this.breakdownSupplementalIdAndSession(transformedExecutionPoint);

    await this.waitForPointToBeInFocusRange(executionPoint);

    const response = await client.Session.createPause({ point: executionPoint }, sessionId);

    if (response.pauseId) {
      this.pauseIdToSessionId.set(response.pauseId, sessionId);
    }

    return response;
  }

  async evaluateExpression(
    pauseId: PauseId,
    expression: string,
    frameId: FrameId | null,
    pure?: boolean
  ): Promise<EvaluationResult> {
    const sessionId = await this.getPauseSessionId(pauseId);

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
          pure,
        },
        sessionId,
        pauseId
      );
      this.transformSupplementalPauseData(response.result.data, sessionId);
      return response.result;
    } else {
      const response = await client.Pause.evaluateInFrame(
        {
          frameId,
          expression,
          pure,
          useOriginalScopes: true,
        },
        sessionId,
        pauseId
      );
      this.transformSupplementalPauseData(response.result.data, sessionId);
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
    this._dispatchEvent("sessionCreated");
    this.sessionWaiter.resolve(sessionId);

    await this.syncFocusWindow();

    return sessionId;
  }

  async findAnnotations(kind: string, listener: AnnotationListener) {
    const sessionId = await this.waitForSession();
    assert(!this.annotationListeners.has(kind), `Annotations of kind ${kind} requested twice`);
    this.annotationListeners.set(kind, listener);
    await client.Session.findAnnotations({ kind }, sessionId);
  }

  async findKeyboardEvents() {
    const sessionId = await this.waitForSession();

    const sortedEvents: KeyboardEvent[] = [];

    const onKeyboardEvents = ({ events }: keyboardEvents) => {
      events.forEach(event => {
        insert(sortedEvents, event, (a, b) => a.time - b.time);
      });
    };

    client.Session.addKeyboardEventsListener(onKeyboardEvents);
    await client.Session.findKeyboardEvents({}, sessionId);
    client.Session.removeKeyboardEventsListener(onKeyboardEvents);

    return sortedEvents;
  }

  async findMessages(onMessage?: (message: Message) => void): Promise<{
    messages: Message[];
    overflow: boolean;
  }> {
    const sessionId = await this.waitForSession();

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

        if (compareExecutionPoints(message.point.point, newMessagePoint)) {
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
    const sessionId = await this.waitForSession();

    // It is important to wait until the range is fully loaded before requesting messages.
    // It would be better if findMessagesInRange errored when the requested range could not be returned,
    // or returned the boundaries of what it did successfully load (see BAC-2536),
    // but right now it will just silently return a subset of messages.
    // Given that we are extra careful here not to to fetch messages in unloaded regions
    // because the result might be invalid (and may get cached by a Suspense caller).
    await this.waitForRangeToBeInFocusRange(pointRange);

    const response = await client.Console.findMessagesInRange({ range: pointRange }, sessionId);

    // Messages aren't guaranteed to arrive sorted, but unsorted messages aren't that useful to work with.
    // So sort them before returning.
    const sortedMessages = response.messages.sort((messageA: Message, messageB: Message) => {
      const pointA = messageA.point.point;
      const pointB = messageB.point.point;
      return compareExecutionPoints(pointA, pointB);
    });

    return {
      messages: sortedMessages,
      overflow: response.overflow == true,
    };
  }

  async findMouseEvents() {
    const sessionId = await this.waitForSession();

    const sortedEvents: MouseEvent[] = [];

    const onMouseEvents = ({ events }: mouseEvents) => {
      events.forEach(event => {
        insert(sortedEvents, event, (a, b) => a.time - b.time);
      });
    };

    client.Session.addMouseEventsListener(onMouseEvents);
    await client.Session.findMouseEvents({}, sessionId);
    client.Session.removeMouseEventsListener(onMouseEvents);

    return sortedEvents;
  }

  async findNavigationEvents() {
    const sessionId = await this.waitForSession();

    const sortedEvents: NavigationEvent[] = [];

    const onNavigationEvents = ({ events }: navigationEvents) => {
      events.forEach(event => {
        insert(sortedEvents, event, (a, b) => a.time - b.time);
      });
    };

    client.Session.addNavigationEventsListener(onNavigationEvents);
    await client.Session.findNavigationEvents({}, sessionId);
    client.Session.removeNavigationEventsListener(onNavigationEvents);

    return sortedEvents;
  }

  _findNetworkRequestsCalled: boolean = false;

  async findNetworkRequests(onRequestsReceived?: (requests: Requests) => void): Promise<{
    events: RequestEventInfo[];
    requests: RequestInfo[];
  }> {
    // HACK
    // Calling this method more than once is unsafe;
    // the protocol API is not stateful and relies on a global event listener.
    // This relies on an in-memory caching layer (likely a Suspense cache).
    assert(
      this._findNetworkRequestsCalled === false,
      "findNetworkRequests should only be called once"
    );

    this._findNetworkRequestsCalled = true;

    const sessionId = await this.waitForSession();

    const events: RequestEventInfo[] = [];
    const requests: RequestInfo[] = [];

    const listener = (data: Requests) => {
      onRequestsReceived?.(data);

      events.push(...data.events);
      requests.push(...data.requests);
    };

    client.Network.addRequestsListener(listener);

    await client.Network.findRequests({}, sessionId);

    client.Network.removeRequestsListener(listener);

    return { events, requests };
  }

  async findPaints(): Promise<TimeStampedPointWithPaintHash[]> {
    const sessionId = await this.waitForSession();

    const sortedPaints: TimeStampedPointWithPaintHash[] = [{ point: "0", time: 0, paintHash: "" }];

    const onPaints = async ({ paints }: paintPoints) => {
      paints.forEach(async ({ point, time, screenShots }) => {
        const paint: TimeStampedPointWithPaintHash = {
          paintHash: screenShots.find(({ mimeType }) => mimeType == "image/jpeg")?.hash ?? "",
          point,
          time,
        };

        insert(sortedPaints, paint, (a, b) => a.time - b.time);
      });
    };

    client.Graphics.addPaintPointsListener(onPaints);
    await client.Graphics.findPaints({}, sessionId);
    client.Graphics.removePaintPointsListener(onPaints);

    return sortedPaints;
  }

  async breakdownSupplementalLocation(location: Location) {
    const { id: sourceId, sessionId, supplementalIndex } = await this.breakdownSupplementalIdAndSession(location.sourceId);
    return { location: { ...location, sourceId }, sessionId, supplementalIndex };
  }

  async breakdownSupplementalPointSelector(pointSelector: PointSelector) {
    switch (pointSelector.kind) {
      case "location": {
        const { location, sessionId, supplementalIndex } = await this.breakdownSupplementalLocation(pointSelector.location);
        return { pointSelector: { ...pointSelector, location }, sessionId, supplementalIndex };
      }
      case "locations": {
        let commonSessionId: string | undefined;
        let commonSupplementalIndex = 0;
        const locations = await Promise.all(pointSelector.locations.map(async transformedLocation => {
          const { location, sessionId, supplementalIndex } = await this.breakdownSupplementalLocation(transformedLocation);
          if (commonSessionId) {
            assert(commonSessionId == sessionId);
          } else {
            commonSessionId = sessionId;
            commonSupplementalIndex = supplementalIndex;
          }
          return location;
        }));
        assert(commonSessionId);
        return { pointSelector: { ...pointSelector, locations }, sessionId: commonSessionId, supplementalIndex: commonSupplementalIndex };
      }
      case "points": {
        let commonSessionId: string | undefined;
        let commonSupplementalIndex = 0;
        const points = await Promise.all(pointSelector.points.map(async transformedPoint => {
          const { id: point, sessionId, supplementalIndex } = await this.breakdownSupplementalIdAndSession(transformedPoint);
          if (commonSessionId) {
            assert(commonSessionId == sessionId);
          } else {
            commonSessionId = sessionId;
            commonSupplementalIndex = supplementalIndex;
          }
          return point;
        }));
        assert(commonSessionId);
        return { pointSelector: { ...pointSelector, points }, sessionId: commonSessionId, supplementalIndex: commonSupplementalIndex };
      }
      default:
        return { pointSelector, sessionId: await this.waitForSession(), supplementalIndex: 0 };
    }
  }

  async findPoints(
    transformedPointSelector: PointSelector,
    pointLimits?: PointPageLimits
  ): Promise<PointDescription[]> {
    const { pointSelector, sessionId } = await this.breakdownSupplementalPointSelector(transformedPointSelector);

    const points: PointDescription[] = [];
    const findPointsId = String(this.nextFindPointsId++);
    pointLimits = (pointLimits && this.isMainSession(sessionId)) ? { ...pointLimits } : {};
    if (!pointLimits.maxCount) {
      pointLimits.maxCount = MAX_POINTS_TO_FIND;
    }

    await this.waitForRangeToBeInFocusRange(
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

    if (result.nextBegin) {
      throw commandError("Too many points", ProtocolError.TooManyPoints);
    }

    points.sort((a, b) => compareExecutionPoints(a.point, b.point));
    points.forEach(desc => this.transformSupplementalPointDescription(desc, sessionId));
    return points;
  }

  private getSupplementalIndexRecordingId(supplementalIndex: number) {
    if (!supplementalIndex) {
      assert(this._recordingId);
      return this._recordingId;
    }
    return this.supplemental[supplementalIndex - 1].serverRecordingId;
  }

  private forAllConnections(callback: (serverRecordingId: string, connection: SupplementalRecordingConnection, supplementalIndex: number) => void) {
    this.supplemental.forEach(({ serverRecordingId, connections }, i) => {
      for (const connection of connections) {
        callback(serverRecordingId, connection, i + 1);
      }
    });
  }

  getTargetPoint(point: ExecutionPoint, pointSupplementalIndex: number): {
    point: TimeStampedPoint, supplementalIndex: number
  } | null {
    const recordingId = this.getSupplementalIndexRecordingId(pointSupplementalIndex);

    let targetPoint: TimeStampedPoint | undefined;
    let targetSupplementalIndex = 0;
    this.forAllConnections((serverRecordingId, connection, supplementalIndex) => {
      const { clientFirst, clientRecordingId, clientPoint, serverPoint } = connection;
      if (clientFirst) {
        if (clientRecordingId == recordingId && clientPoint.point == point) {
          targetPoint = serverPoint;
          targetSupplementalIndex = supplementalIndex;
        }
      } else {
        if (serverRecordingId == recordingId && serverPoint.point == point) {
          assert(clientRecordingId == this._recordingId, "NYI");
          targetPoint = clientPoint;
          targetSupplementalIndex = 0;
        }
      }
    });

    if (!targetPoint) {
      return null;
    }

    return { point: targetPoint, supplementalIndex: targetSupplementalIndex };
  }

  private async maybeGetConnectionStepTarget(point: ExecutionPoint, pointSupplementalIndex: number): Promise<PauseDescription | null> {

    const targetPoint = this.getTargetPoint(point, pointSupplementalIndex);
    if (!targetPoint) {
      return null;
    }

    const sessionId = await this.getSupplementalIndexSession(targetPoint.supplementalIndex);

    const response = await sendMessage("Session.getPointFrameSteps" as any, { point: targetPoint.point }, sessionId);
    const { steps } = response;
    const desc = steps.find((step: PointDescription) => step.point == targetPoint.point?.point);
    assert(desc);

    this.transformSupplementalPointDescription(desc, sessionId);
    return { ...desc, reason: "step" };
  }

  async findStepInTarget(transformedPoint: ExecutionPoint): Promise<PauseDescription> {
    const { id: point, sessionId, supplementalIndex } = await this.breakdownSupplementalIdAndSession(transformedPoint);
    const connectionStepTarget = await this.maybeGetConnectionStepTarget(point, supplementalIndex);
    if (connectionStepTarget) {
      return connectionStepTarget;
    }
    const { target } = await client.Debugger.findStepInTarget({ point }, sessionId);
    this.transformSupplementalPointDescription(target, sessionId);
    return target;
  }

  async findStepOutTarget(transformedPoint: ExecutionPoint): Promise<PauseDescription> {
    const { id: point, sessionId } = await this.breakdownSupplementalIdAndSession(transformedPoint);
    const { target } = await client.Debugger.findStepOutTarget({ point }, sessionId);
    this.transformSupplementalPointDescription(target, sessionId);
    return target;
  }

  async findStepOverTarget(transformedPoint: ExecutionPoint): Promise<PauseDescription> {
    const { id: point, sessionId } = await this.breakdownSupplementalIdAndSession(transformedPoint);
    const { target } = await client.Debugger.findStepOverTarget({ point }, sessionId);
    this.transformSupplementalPointDescription(target, sessionId);
    return target;
  }

  async findReverseStepOverTarget(transformedPoint: ExecutionPoint): Promise<PauseDescription> {
    const { id: point, sessionId } = await this.breakdownSupplementalIdAndSession(transformedPoint);
    const { target } = await client.Debugger.findReverseStepOverTarget({ point }, sessionId);
    this.transformSupplementalPointDescription(target, sessionId);
    return target;
  }

  async findSources(): Promise<Source[]> {
    const sources: Source[] = [];

    await this.forEachSession(async (sessionId, supplementalIndex) => {
      const newSourceListener = (source: Source) => {
        sources.push(source);
      };
      const newSourcesListener = ({ sources: sourcesList }: newSources) => {
        for (const source of sourcesList) {
          if (supplementalIndex) {
            source.sourceId = transformSupplementalId(source.sourceId, supplementalIndex);
            source.generatedSourceIds = source.generatedSourceIds?.map(id => transformSupplementalId(id, supplementalIndex));
          }
          sources.push(source);
        }
      };

      client.Debugger.addNewSourceListener(newSourceListener);
      client.Debugger.addNewSourcesListener(newSourcesListener);
      await client.Debugger.findSources({}, sessionId);
      client.Debugger.removeNewSourceListener(newSourceListener);
      client.Debugger.removeNewSourcesListener(newSourcesListener);
    });

    return sources;
  }

  private transformSupplementalLocation(location: Location, supplementalIndex: number) {
    location.sourceId = transformSupplementalId(location.sourceId, supplementalIndex);
  }

  private transformSupplementalMappedLocation(mappedLocation: MappedLocation | undefined, supplementalIndex: number) {
    for (const location of mappedLocation || []) {
      this.transformSupplementalLocation(location, supplementalIndex);
    }
  }

  private transformSupplementalPauseData(data: PauseData, sessionId: string) {
    const supplementalIndex = this.getSessionIdSupplementalIndex(sessionId);
    if (!supplementalIndex) {
      return;
    }
    for (const frame of data.frames || []) {
      this.transformSupplementalMappedLocation(frame.location, supplementalIndex);
      this.transformSupplementalMappedLocation(frame.functionLocation, supplementalIndex);
    }
    for (const object of data.objects || []) {
      this.transformSupplementalMappedLocation(object.preview?.functionLocation, supplementalIndex);
    }
  }

  // Convert a time from either the main or a supplemental recording into a time
  // for the main recording.
  private normalizeSupplementalTime(time: number, supplementalIndex: number) {
    if (!supplementalIndex) {
      return 0;
    }
    const delta = this.supplementalTimeDeltas[supplementalIndex - 1];
    if (typeof delta == "number") {
      return time - delta;
    }
    const supplementalSession = this.supplemental[supplementalIndex - 1];
    assert(this._recordingId);
    assert(supplementalSession);
    return interpolateSupplementalTime(this._recordingId, supplementalSession, time);
  }

  private transformSupplementalPointDescription(point: PointDescription, sessionId: string) {
    const supplementalIndex = this.getSessionIdSupplementalIndex(sessionId);
    if (!supplementalIndex) {
      return;
    }
    point.point = transformSupplementalId(point.point, supplementalIndex);
    point.time = this.normalizeSupplementalTime(point.time, supplementalIndex);
    this.transformSupplementalMappedLocation(point.frame, supplementalIndex);
  }

  async getAllFrames(pauseId: PauseId): Promise<getAllFramesResult> {
    const sessionId = await this.getPauseSessionId(pauseId);
    const result = await client.Pause.getAllFrames({}, sessionId, pauseId);
    this.transformSupplementalPauseData(result.data, sessionId);
    return result;
  }

  async getPointStack(transformedPoint: ExecutionPoint, maxCount: number): Promise<PointStackFrame[]> {
    const { id: point, sessionId } = await this.breakdownSupplementalIdAndSession(transformedPoint);
    const result = await client.Session.getPointStack({ point, maxCount }, sessionId);
    return result.frames;
  }

  async getNetworkRequestBody(
    requestId: RequestId,
    onRequestBodyData?: (event: RequestBodyDataEvent) => void
  ): Promise<RequestBodyData[]> {
    const sessionId = await this.waitForSession();

    const data: RequestBodyData[] = [];

    const listener = (event: RequestBodyDataEvent) => {
      if (event.id === requestId) {
        onRequestBodyData?.(event);

        data.push(...event.parts);
      }
    };

    client.Network.addRequestBodyDataListener(listener);

    await client.Network.getRequestBody({ id: requestId }, sessionId);

    client.Network.removeRequestBodyDataListener(listener);

    return data;
  }

  async getNetworkResponseBody(
    requestId: RequestId,
    onResponseBodyData?: (data: ResponseBodyDataEvent) => void
  ): Promise<ResponseBodyData[]> {
    const sessionId = await this.waitForSession();

    const data: ResponseBodyData[] = [];

    const listener = (event: ResponseBodyDataEvent) => {
      if (event.id === requestId) {
        onResponseBodyData?.(event);

        data.push(...event.parts);
      }
    };

    client.Network.addResponseBodyDataListener(listener);

    await client.Network.getResponseBody({ id: requestId }, sessionId);

    client.Network.removeResponseBodyDataListener(listener);

    return data;
  }

  async getTopFrame(pauseId: PauseId): Promise<getTopFrameResult> {
    const sessionId = await this.getPauseSessionId(pauseId);
    const result = await client.Pause.getTopFrame({}, sessionId, pauseId);
    this.transformSupplementalPauseData(result.data, sessionId);
    return result;
  }

  async hasAnnotationKind(kind: string): Promise<boolean> {
    const sessionId = await this.waitForSession();
    const { hasKind } = await client.Session.hasAnnotationKind({ kind }, sessionId);
    return hasKind;
  }

  async getAnnotationKinds(): Promise<string[]> {
    const sessionId = await this.waitForSession();
    const { kinds } = await client.Session.getAnnotationKinds({}, sessionId);
    return kinds;
  }

  async getAllBoundingClientRects(pauseId: string): Promise<getAllBoundingClientRectsResult> {
    const sessionId = await this.getPauseSessionId(pauseId);
    return client.DOM.getAllBoundingClientRects({}, sessionId, pauseId);
  }

  async getAppliedRules(pauseId: string, nodeId: string): Promise<getAppliedRulesResult> {
    const sessionId = await this.getPauseSessionId(pauseId);
    return client.CSS.getAppliedRules({ node: nodeId }, sessionId, pauseId);
  }

  async getBoundingClientRect(
    pauseId: string,
    nodeId: string
  ): Promise<getBoundingClientRectResult> {
    const sessionId = await this.getPauseSessionId(pauseId);
    return client.DOM.getBoundingClientRect({ node: nodeId }, sessionId, pauseId);
  }

  async getBoxModel(pauseId: string, nodeId: string): Promise<getBoxModelResult> {
    const sessionId = await this.getPauseSessionId(pauseId);
    return client.DOM.getBoxModel({ node: nodeId }, sessionId, pauseId);
  }

  async getComputedStyle(pauseId: PauseId, nodeId: string): Promise<getComputedStyleResult> {
    const sessionId = await this.getPauseSessionId(pauseId);
    return client.CSS.getComputedStyle({ node: nodeId }, sessionId, pauseId);
  }

  async getDocument(pauseId: string): Promise<getDocumentResult> {
    const sessionId = await this.getPauseSessionId(pauseId);
    return client.DOM.getDocument({}, sessionId, pauseId);
  }

  async getEventListeners(pauseId: string, nodeId: string): Promise<getEventListenersResult> {
    const sessionId = await this.getPauseSessionId(pauseId);
    return client.DOM.getEventListeners({ node: nodeId }, sessionId, pauseId);
  }

  async getParentNodes(pauseId: string, nodeId: string): Promise<getParentNodesResult> {
    const sessionId = await this.getPauseSessionId(pauseId);
    return client.DOM.getParentNodes({ node: nodeId }, sessionId, pauseId);
  }

  async performSearch(pauseId: string, query: string): Promise<performSearchResult> {
    const sessionId = await this.getPauseSessionId(pauseId);
    return client.DOM.performSearch({ query }, sessionId, pauseId);
  }

  async querySelector(
    pauseId: string,
    nodeId: string,
    selector: string
  ): Promise<querySelectorResult> {
    const sessionId = await this.getPauseSessionId(pauseId);
    return client.DOM.querySelector({ node: nodeId, selector }, sessionId, pauseId);
  }

  async getEventCountForTypes(
    eventTypes: string[],
    range: PointRange | null
  ): Promise<Record<string, number>> {
    const sessionId = await this.waitForSession();
    const { counts } = await client.Debugger.getEventHandlerCounts(
      { eventTypes, range: range ?? undefined },
      sessionId
    );
    return Object.fromEntries(counts.map(({ type, count }) => [type, count]));
  }

  async getAllEventHandlerCounts(range: PointRange | null): Promise<Record<string, number>> {
    const sessionId = await this.waitForSession();
    const { counts } = await client.Debugger.getAllEventHandlerCounts(
      { range: range ?? undefined },
      sessionId
    );
    const countsObject = Object.fromEntries(counts.map(({ type, count }) => [type, count]));
    return countsObject;
  }

  async getExceptionValue(pauseId: PauseId): Promise<getExceptionValueResult> {
    const sessionId = await this.getPauseSessionId(pauseId);
    const result = await client.Pause.getExceptionValue({}, sessionId, pauseId);
    this.transformSupplementalPauseData(result.data, sessionId);
    return result;
  }

  private async syncFocusWindow(): Promise<TimeStampedPointRange> {
    const sessionId = await this.waitForSession();
    const { window } = await client.Session.getFocusWindow({}, sessionId);
    this.focusWindow = window;
    this._dispatchEvent("focusWindowChange", window);
    return window;
  }

  async getFrameSteps(pauseId: PauseId, frameId: FrameId): Promise<PointDescription[]> {
    const sessionId = await this.getPauseSessionId(pauseId);
    const { steps } = await client.Pause.getFrameSteps({ frameId }, sessionId, pauseId);
    for (const step of steps) {
      this.transformSupplementalPointDescription(step, sessionId);
    }
    return steps;
  }

  async getObjectProperty(
    objectId: ObjectId,
    pauseId: PauseId,
    propertyName: string
  ): Promise<Result> {
    const sessionId = await this.getPauseSessionId(pauseId);
    const { result } = await client.Pause.getObjectProperty(
      {
        object: objectId,
        name: propertyName,
      },
      sessionId,
      pauseId
    );
    this.transformSupplementalPauseData(result.data, sessionId);
    return result;
  }

  async getObjectWithPreview(
    objectId: ObjectId,
    pauseId: PauseId,
    level?: ObjectPreviewLevel
  ): Promise<PauseData> {
    const sessionId = await this.getPauseSessionId(pauseId);
    const result = await client.Pause.getObjectPreview(
      { level, object: objectId },
      sessionId,
      pauseId || undefined
    );
    this.transformSupplementalPauseData(result.data, sessionId);
    return result.data;
  }

  async getPointNearTime(time: number): Promise<TimeStampedPoint> {
    const sessionId = await this.waitForSession();

    const { point } = await client.Session.getPointNearTime({ time }, sessionId);
    return point;
  }

  async getPointsBoundingTime(time: number): Promise<PointsBoundingTime> {
    const sessionId = await this.waitForSession();

    const result = await client.Session.getPointsBoundingTime({ time }, sessionId);
    return result;
  }

  getRecordingId(): RecordingId | null {
    return this._recordingId;
  }

  async getScope(pauseId: PauseId, scopeId: ScopeId): Promise<getScopeResult> {
    const sessionId = await this.getPauseSessionId(pauseId);
    const result = await client.Pause.getScope({ scope: scopeId }, sessionId, pauseId);
    return result;
  }

  async getScopeMap(location: Location): Promise<VariableMapping[] | undefined> {
    const sessionId = await this.waitForSession();
    const { map } = await client.Debugger.getScopeMap({ location }, sessionId);
    return map;
  }

  async getScreenshot(transformedPoint: ExecutionPoint): Promise<ScreenShot> {
    const { id: point, sessionId } = await this.breakdownSupplementalIdAndSession(transformedPoint);
    const { screen } = await client.Graphics.getPaintContents(
      { point, mimeType: "image/jpeg" },
      sessionId
    );
    return screen;
  }

  async mapExpressionToGeneratedScope(expression: string, transformedLocation: Location): Promise<string> {
    const { location, sessionId } = await this.breakdownSupplementalLocation(transformedLocation);
    const result = await client.Debugger.mapExpressionToGeneratedScope(
      { expression, location },
      sessionId
    );
    return result.expression;
  }

  async getSessionEndpoint(): Promise<TimeStampedPoint> {
    const sessionId = await this.waitForSession();
    const { endpoint } = await client.Session.getEndpoint({}, sessionId);
    return endpoint;
  }

  getSessionId = (): SessionId | null => this._sessionId;

  async getSourceHitCounts(
    transformedSourceId: SourceId,
    locations: SameLineSourceLocations[],
    focusRange: PointRange | null
  ) {
    const { id: sourceId, sessionId } = await this.breakdownSupplementalIdAndSession(transformedSourceId);

    await this.waitForRangeToBeInFocusRange(focusRange);
    const { hits } = await client.Debugger.getHitCounts(
      { sourceId, locations, maxHits: TOO_MANY_POINTS_TO_FIND, range: (this.isMainSession(sessionId) && focusRange) || undefined },
      sessionId
    );
    return hits;
  }

  async getSourceOutline(transformedSourceId: SourceId) {
    const { id: sourceId, sessionId } = await this.breakdownSupplementalIdAndSession(transformedSourceId);
    return client.Debugger.getSourceOutline({ sourceId }, sessionId);
  }

  async getBreakpointPositions(
    transformedSourceId: SourceId,
    locationRange: SourceLocationRange | null
  ): Promise<SameLineSourceLocations[]> {
    const { id: sourceId, sessionId } = await this.breakdownSupplementalIdAndSession(transformedSourceId);

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

  async getMappedLocation(transformedLocation: Location): Promise<MappedLocation> {
    const { location, sessionId } = await this.breakdownSupplementalLocation(transformedLocation);
    const { mappedLocation } = await client.Debugger.getMappedLocation({ location }, sessionId);
    return mappedLocation;
  }

  async requestFocusWindow(params: PointRangeFocusRequest): Promise<TimeStampedPointRange> {
    const sessionId = await this.waitForSession();

    const { window } = await client.Session.requestFocusWindow(
      {
        request: params,
      },
      sessionId
    );

    this.focusWindow = window;
    this._dispatchEvent("focusWindowChange", window);

    return window;
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

  async repaintGraphics(pauseId: PauseId): Promise<repaintGraphicsResult> {
    const sessionId = await this.getPauseSessionId(pauseId);
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
    const sessionId = await this.waitForSession();
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
      useRegex,
      wholeWord,
      caseSensitive,
    }: {
      caseSensitive?: boolean;
      limit?: number;
      query: string;
      sourceIds?: string[];
      useRegex?: boolean;
      wholeWord?: boolean;
    },
    onMatches: (matches: SearchSourceContentsMatch[], didOverflow: boolean) => void
  ): Promise<void> {
    const sessionId = await this.waitForSession();
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
        {
          limit,
          searchId: thisSearchUniqueId,
          sourceIds,
          query,
          useRegex,
          wholeWord,
          caseSensitive,
        },
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
      preloadExpressions?: RunEvaluationPreload[];
      expression: string;
      frameIndex?: number;
      fullPropertyPreview?: boolean;
      limits?: PointPageLimits;
      shareProcesses?: boolean;
    },
    onResults: (results: RunEvaluationResult[]) => void
  ): Promise<void> {
    const { pointSelector, sessionId, supplementalIndex } = await this.breakdownSupplementalPointSelector(opts.selector);
    const runEvaluationId = String(this.nextRunEvaluationId++);
    const pointLimits: PointPageLimits = (opts.limits && !supplementalIndex) ? { ...opts.limits } : {};
    if (!pointLimits.maxCount) {
      pointLimits.maxCount = MAX_POINTS_TO_RUN_EVALUATION;
    }

    await this.waitForRangeToBeInFocusRange(
      pointLimits.begin && pointLimits.end
        ? { begin: pointLimits.begin, end: pointLimits.end }
        : null
    );

    const onResultsWrapper = (results: runEvaluationResults) => {
      if (results.runEvaluationId === runEvaluationId) {
        for (const result of results.results) {
          this.transformSupplementalPointDescription(result.point, sessionId);
          this.transformSupplementalPauseData(result.data, sessionId);
        }
        onResults(results.results);
      }
    };

    addEventListener("Session.runEvaluationResults", onResultsWrapper);

    let result;
    try {
      result = await client.Session.runEvaluation(
        {
          preloadExpressions: opts.preloadExpressions,
          expression: opts.expression,
          frameIndex: opts.frameIndex,
          fullReturnedPropertyPreview: opts.fullPropertyPreview,
          pointLimits,
          pointSelector,
          runEvaluationId,
          shareProcesses: opts.shareProcesses,
        },
        sessionId
      );
    } finally {
      removeEventListener("Session.runEvaluationResults", onResultsWrapper);
    }

    if (result.nextBegin) {
      throw commandError("Too many points", ProtocolError.TooManyPoints);
    }
  }

  async streamSourceContents(
    transformedSourceId: SourceId,
    onSourceContentsInfo: (params: sourceContentsInfo) => void,
    onSourceContentsChunk: (params: sourceContentsChunk) => void
  ): Promise<void> {
    const { id: sourceId, sessionId } = await this.breakdownSupplementalIdAndSession(transformedSourceId);

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

  async waitForPointToBeInFocusRange(point: ExecutionPoint): Promise<void> {
    return new Promise(resolve => {
      const checkFocusRange = () => {
        let isInFocusRange = false;
        if (this.focusWindow !== null) {
          isInFocusRange = isPointInRegion(point, this.focusWindow);
        }

        if (isInFocusRange) {
          resolve();

          this.removeEventListener("focusWindowChange", checkFocusRange);
        }
      };

      this.addEventListener("focusWindowChange", checkFocusRange);

      checkFocusRange();
    });
  }

  async waitForRangeToBeInFocusRange(
    range: TimeStampedPointRange | PointRange | null
  ): Promise<void> {
    if (range === null) {
      return Promise.resolve();
    }

    return new Promise(resolve => {
      const checkFocusRange = () => {
        let isInFocusRange = false;
        if (this.focusWindow !== null) {
          isInFocusRange = isRangeInRegions(range, [this.focusWindow]);
        }

        if (isInFocusRange) {
          resolve();

          this.removeEventListener("focusWindowChange", checkFocusRange);
        }
      };

      this.addEventListener("focusWindowChange", checkFocusRange);

      checkFocusRange();
    });
  }

  getCurrentFocusWindow(): TimeStampedPointRange | null {
    return this.focusWindow;
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

  private onAnnotations = (annotations: annotations) => {
    for (const annotation of annotations.annotations) {
      const listener = this.annotationListeners.get(annotation.kind);
      assert(listener, `No listener for annotations of kind ${annotation.kind}`);
      listener(annotation);
    }
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

// Compute the delta to adjust the timestamps for a supplemental server recording.
// A delta is the time difference between the base recording and the supplemental
// recording: a smaller delta moves the supplemental recording later, and a larger
// delta moves the supplemental recording closer.
//
// We want to find a delta that is small enough that all client-first connections
// happen on the client before they happen on the server, and large enough that
// all client-last connections happen on the server before they happen on the client.
//
// If there is no such delta then we're seeing inconsistent timing information with
// the connections and will fall back onto interpolateSupplementalTime.
function computeSupplementalTimeDelta(recordingId: string, supplemental: SupplementalSession): number | undefined {
  // Delta which ensures that all clientFirst connections happen
  // on the client before they happen on the server.
  let clientFirstDelta: number | undefined;

  // Delta which ensures that all clientLast connections happen
  // on the server before they happen on the client.
  let clientLastDelta: number | undefined;

  for (const { clientFirst, clientRecordingId, clientPoint, serverPoint } of supplemental.connections) {
    assert(recordingId == clientRecordingId);
    const delta = serverPoint.time - clientPoint.time;
    if (clientFirst) {
      if (typeof clientFirstDelta == "undefined" || delta < clientFirstDelta) {
        clientFirstDelta = delta;
      }
    } else {
      if (typeof clientLastDelta == "undefined" || delta > clientLastDelta) {
        clientLastDelta = delta;
      }
    }
  }
  assert(typeof clientFirstDelta != "undefined");
  assert(typeof clientLastDelta != "undefined");

  if (clientFirstDelta < clientLastDelta) {
    // There is no single delta we'll be able to use.
    return undefined;
  }

  return (clientFirstDelta + clientLastDelta) / 2;
}

// If necessary add an artificial small time difference between client
// server points in a connection when interpolating. This ensures that
// client events in the connection actually happen before the server
// event on the timeline instead of at the exact same time, which can
// cause console messages to be rendered in the wrong order.
function adjustInterpolateSupplementalTime(connection: SupplementalRecordingConnection, clientTime: number) {
  const { clientFirst, clientPoint } = connection;
  const Epsilon = 0.1;
  if (clientFirst) {
    if (clientTime >= clientPoint.time && clientTime - clientPoint.time <= Epsilon) {
      return clientPoint.time + Epsilon;
    }
  } else {
    if (clientTime <= clientPoint.time && clientPoint.time - clientTime <= Epsilon) {
      return clientPoint.time - Epsilon;
    }
  }
  return clientTime;
}

// Use an interpolation strategy to normalize a time from a supplemental recording
// to a time in the base recording.
//
// This works even if there is no single consistent delta to use throughout the
// recording, and requires that events on either side of the connections happen
// in the same order in the two recordings.
function interpolateSupplementalTime(recordingId: string, supplemental: SupplementalSession, supplementalTime: number): number {
  assert(supplemental.connections.length);
  for (const connection of supplemental.connections) {
    assert(connection.clientRecordingId == recordingId);
  }

  // Check if the time happens between two connections.
  for (let i = 1; i < supplemental.connections.length; i++) {
    const previous = supplemental.connections[i - 1];
    const next = supplemental.connections[i];
    assert(previous.clientPoint.time <= next.clientPoint.time);
    assert(previous.serverPoint.time <= next.serverPoint.time);
    if (supplementalTime >= previous.serverPoint.time &&
      supplementalTime <= next.serverPoint.time) {
      const clientElapsed = next.clientPoint.time - previous.clientPoint.time;
      const serverElapsed = next.serverPoint.time - previous.serverPoint.time;
      const fraction = (supplementalTime - previous.serverPoint.time) / serverElapsed;
      const clientTime = previous.clientPoint.time + fraction * clientElapsed;
      const adjustPrevious = adjustInterpolateSupplementalTime(previous, clientTime);
      if (adjustPrevious != clientTime) {
        return adjustPrevious;
      }
      return adjustInterpolateSupplementalTime(next, clientTime);
    }
  }

  // Check if the time happened before the first connection.
  const firstConnection = supplemental.connections[0];
  if (supplementalTime <= firstConnection.serverPoint.time) {
    const delta = firstConnection.serverPoint.time - firstConnection.clientPoint.time;
    return adjustInterpolateSupplementalTime(firstConnection, supplementalTime - delta);
  }

  // The time must have happened after the last connection.
  const lastConnection = supplemental.connections[supplemental.connections.length - 1];
  assert(supplementalTime >= lastConnection.serverPoint.time);
  const delta = lastConnection.serverPoint.time - lastConnection.clientPoint.time;
  return adjustInterpolateSupplementalTime(lastConnection, supplementalTime - delta);
}
