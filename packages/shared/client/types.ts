import {
  Annotation,
  ContentType,
  Result as EvaluationResult,
  EventHandlerType,
  ExecutionPoint,
  FrameId,
  FunctionMatch,
  HitCount,
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
  PointLimits,
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
  SourceLocation,
  TimeStampedPoint,
  TimeStampedPointRange,
  VariableMapping,
  createPauseResult,
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
  getSourceOutlineResult,
  getTopFrameResult,
  performSearchResult,
  querySelectorResult,
  repaintGraphicsResult,
} from "@replayio/protocol";

export type LogEntry = {
  args: any[];
  isAsync: boolean;
  method: string;
  result: any;
};

export type ColumnHits = {
  hits: number;
  location: SourceLocation;
};

export type LineHitCounts = {
  count: number;
  firstBreakableColumnIndex: number;
};
export type LineNumberToHitCountMap = Map<number, LineHitCounts>;

export type Events = {
  keyboardEvents: KeyboardEvent[];
  mouseEvents: MouseEvent[];
  navigationEvents: NavigationEvent[];
};

export const POINT_BEHAVIOR_ENABLED = "enabled";
export const POINT_BEHAVIOR_DISABLED = "disabled";
export const POINT_BEHAVIOR_DISABLED_TEMPORARILY = "disabled-temporarily";

export type POINT_BEHAVIOR =
  | typeof POINT_BEHAVIOR_ENABLED
  | typeof POINT_BEHAVIOR_DISABLED
  | typeof POINT_BEHAVIOR_DISABLED_TEMPORARILY;

export type PartialUser = {
  id: string;
  name: string | null;
  picture: string | null;
};

export type PointKey = string;
export type Badge = "blue" | "green" | "orange" | "purple" | "unicorn" | "yellow";

// Points are saved to GraphQL.
// They can be viewed by all users who have access to a recording.
// They can only be edited or deleted by the user who created them.
//
// Note that Points are only saved to GraphQL for authenticated users.
// They are also saved to IndexedDB to support unauthenticated users.
export type Point = {
  // This a client-assigned value is used as the primary key on the server.
  // It exists to simplify equality checks and PointBehavior mapping.
  key: PointKey;

  // These attributes are fixed after Point creation
  createdAt: Date;
  location: Location;
  recordingId: RecordingId;
  user: PartialUser | null;

  // These attributes are editable, although only by the Point's owner
  badge: Badge | null;
  condition: string | null;
  content: string;
};

// Point behaviors are saved to IndexedDB.
// (They are remembered between sessions but are not shared with other users.)
// They control a given point behaves locally (e.g. does it log to the console)
// Behaviors are modifiable by everyone (regardless of who created a point).
export type PointBehavior = {
  key: PointKey;
  shouldLog: POINT_BEHAVIOR;
};

export type ReplayClientEvents = "focusWindowChange" | "loadedRegionsChange" | "sessionCreated";

export type HitPointStatus =
  | "complete"
  | "too-many-points-to-find"
  | "too-many-points-to-run-analysis"
  | "unknown-error";

export type HitPointsAndStatusTuple = [points: TimeStampedPoint[], status: HitPointStatus];
export interface SourceLocationRange {
  start: SourceLocation;
  end: SourceLocation;
}

export interface TimeStampedPointWithPaintHash extends TimeStampedPoint {
  paintHash: string;
}

export type AnnotationListener = (annotation: Annotation) => void;

export interface SupplementalRecordingConnection {
  clientFirst: boolean;
  clientRecordingId: string;
  clientPoint: TimeStampedPoint;
  serverPoint: TimeStampedPoint;
}

export interface SupplementalRecording {
  serverRecordingId: string;
  connections: SupplementalRecordingConnection[];
}

export interface SupplementalSession extends SupplementalRecording {
  sessionId: string;
}

export interface ReplayClientInterface {
  get loadedRegions(): LoadedRegions | null;
  addEventListener(type: ReplayClientEvents, handler: Function): void;
  configure(recordingId: string, sessionId: string, supplemental: SupplementalSession[]): Promise<void>;
  createPause(executionPoint: ExecutionPoint): Promise<createPauseResult>;
  evaluateExpression(
    pauseId: PauseId,
    expression: string,
    frameId: FrameId | null,
    pure?: boolean
  ): Promise<EvaluationResult>;
  findAnnotations(kind: string, listener: AnnotationListener): Promise<void>;
  findKeyboardEvents(): Promise<KeyboardEvent[]>;
  findMessages(onMessage?: (message: Message) => void): Promise<{
    messages: Message[];
    overflow: boolean;
  }>;
  findMessagesInRange(focusRange: PointRange): Promise<{
    messages: Message[];
    overflow: boolean;
  }>;
  findMouseEvents(): Promise<MouseEvent[]>;
  findNavigationEvents(): Promise<NavigationEvent[]>;
  findNetworkRequests(
    onRequestsReceived?: (data: { requests: RequestInfo[]; events: RequestEventInfo[] }) => void
  ): Promise<{
    events: RequestEventInfo[];
    requests: RequestInfo[];
  }>;
  findPaints(): Promise<TimeStampedPointWithPaintHash[]>;
  findPoints(selector: PointSelector, limits?: PointLimits): Promise<PointDescription[]>;

  findStepInTarget(point: ExecutionPoint): Promise<PauseDescription>;
  findStepOutTarget(point: ExecutionPoint): Promise<PauseDescription>;
  findStepOverTarget(point: ExecutionPoint): Promise<PauseDescription>;
  findReverseStepOverTarget(point: ExecutionPoint): Promise<PauseDescription>;
  findSources(): Promise<Source[]>;
  getAllBoundingClientRects(pauseId: PauseId): Promise<getAllBoundingClientRectsResult>;
  getAllEventHandlerCounts(range: PointRange | null): Promise<Record<string, number>>;
  getAllFrames(pauseId: PauseId): Promise<getAllFramesResult>;
  getPointStack(point: ExecutionPoint, maxCount: number): Promise<PointStackFrame[]>;
  getAnnotationKinds(): Promise<string[]>;
  getAppliedRules(pauseId: PauseId, nodeId: string): Promise<getAppliedRulesResult>;
  getBoundingClientRect(pauseId: PauseId, nodeId: string): Promise<getBoundingClientRectResult>;
  getBoxModel(pauseId: PauseId, nodeId: string): Promise<getBoxModelResult>;
  getBreakpointPositions(
    sourceId: SourceId,
    range: SourceLocationRange | null
  ): Promise<SameLineSourceLocations[]>;
  getBuildId(): Promise<string>;
  getComputedStyle(pauseId: PauseId, nodeId: string): Promise<getComputedStyleResult>;
  getDocument(pauseId: PauseId): Promise<getDocumentResult>;
  getEventCountForTypes(
    eventTypes: EventHandlerType[],
    focusRange: PointRange | null
  ): Promise<Record<string, number>>;
  getEventListeners(pauseId: PauseId, nodeId: string): Promise<getEventListenersResult>;
  getExceptionValue(pauseId: PauseId): Promise<getExceptionValueResult>;
  getFrameSteps(pauseId: PauseId, frameId: FrameId): Promise<PointDescription[]>;
  getMappedLocation(location: Location): Promise<MappedLocation>;
  getObjectWithPreview(
    objectId: ObjectId,
    pauseId: PauseId,
    level?: ObjectPreviewLevel
  ): Promise<PauseData>;
  getObjectProperty(objectId: ObjectId, pauseId: PauseId, propertyName: string): Promise<Result>;
  getParentNodes(pauseId: PauseId, nodeId: string): Promise<getParentNodesResult>;
  getPointNearTime(time: number): Promise<TimeStampedPoint>;
  getPointsBoundingTime(time: number): Promise<PointsBoundingTime>;
  getRecordingId(): RecordingId | null;
  getNetworkRequestBody(
    requestId: RequestId,
    onRequestBodyData?: (event: RequestBodyDataEvent) => void
  ): Promise<RequestBodyData[]>;
  getNetworkResponseBody(
    requestId: RequestId,
    onResponseBodyData?: (data: ResponseBodyDataEvent) => void
  ): Promise<ResponseBodyData[]>;
  getScope(pauseId: PauseId, scopeId: ScopeId): Promise<getScopeResult>;
  getScopeMap(location: Location): Promise<VariableMapping[] | undefined>;
  getScreenshot(point: ExecutionPoint): Promise<ScreenShot>;
  getSessionEndpoint(): Promise<TimeStampedPoint>;
  getSessionId(): SessionId | null;
  getSourceHitCounts(
    sourceId: SourceId,
    locations: SameLineSourceLocations[],
    focusRange: PointRange | null
  ): Promise<HitCount[]>;
  getSourceOutline(sourceId: SourceId): Promise<getSourceOutlineResult>;
  getTopFrame(pauseId: PauseId): Promise<getTopFrameResult>;
  hasAnnotationKind(kind: string): Promise<boolean>;
  initialize(recordingId: string, accessToken: string | null): Promise<SessionId>;
  mapExpressionToGeneratedScope(expression: string, location: Location): Promise<string>;
  requestFocusWindow(params: PointRangeFocusRequest): Promise<TimeStampedPointRange>;
  getCurrentFocusWindow(): TimeStampedPointRange | null;
  performSearch(pauseId: PauseId, query: string): Promise<performSearchResult>;
  querySelector(pauseId: PauseId, nodeId: string, selector: string): Promise<querySelectorResult>;
  removeEventListener(type: ReplayClientEvents, handler: Function): void;
  repaintGraphics(pauseId: PauseId): Promise<repaintGraphicsResult>;
  runEvaluation(
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
  ): Promise<void>;
  searchFunctions(
    opts: {
      query: string;
      sourceIds?: string[];
    },
    onMatches: (matches: FunctionMatch[]) => void
  ): Promise<void>;
  searchSources(
    opts: {
      limit?: number;
      query: string;
      sourceIds?: string[];
      useRegex?: boolean;
      wholeWord?: boolean;
      caseSensitive?: boolean;
    },
    onMatches: (matches: SearchSourceContentsMatch[], didOverflow: boolean) => void
  ): Promise<void>;
  streamSourceContents(
    sourceId: SourceId,
    onSourceContentsInfo: ({
      codeUnitCount,
      contentType,
      lineCount,
      sourceId,
    }: {
      codeUnitCount: number;
      contentType: ContentType;
      lineCount: number;
      sourceId: SourceId;
    }) => void,
    onSourceContentsChunk: ({ chunk, sourceId }: { chunk: string; sourceId: SourceId }) => void
  ): Promise<void>;
  waitForSession(): Promise<string>;
  numSupplementalRecordings(): number;
}
