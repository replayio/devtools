import {
  ContentType,
  createPauseResult,
  EventHandlerType,
  ExecutionPoint,
  FrameId,
  KeyboardEvent,
  loadedRegions as LoadedRegions,
  Location,
  Message,
  MouseEvent,
  NavigationEvent,
  newSource as Source,
  ObjectId,
  ObjectPreviewLevel,
  PauseData,
  PauseId,
  RecordingId,
  Result as EvaluationResult,
  SessionId,
  SearchSourceContentsMatch,
  SourceId,
  SourceLocation,
  TimeStampedPoint,
  TimeStampedPointRange,
  TimeRange,
  FunctionMatch,
  keyboardEvents,
  navigationEvents,
  Result,
  MappedLocation,
  SameLineSourceLocations,
  getPointsBoundingTimeResult as PointsBoundingTime,
  PointRange,
  BreakpointId,
} from "@replayio/protocol";
import { AnalysisParams } from "protocol/analysisManager";
import { RecordingCapabilities } from "protocol/thread/thread";

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

export type LineHits = {
  columnHits: ColumnHits[];
  hits: number;
};

export type Events = {
  keyboardEvents: KeyboardEvent[];
  mouseEvents: MouseEvent[];
  navigationEvents: NavigationEvent[];
};

export type PointId = number;
export type Badge = "blue" | "green" | "orange" | "purple" | "unicorn" | "yellow";
export type Point = {
  badge: Badge | null;
  condition: string | null;
  content: string;
  id: PointId;
  location: Location;
  shouldBreak: boolean;
  shouldLog: boolean;
};

export type RunAnalysisParams = Omit<AnalysisParams, "locations"> & { location?: Location };

export type ReplayClientEvents = "loadedRegionsChange";

export type HitPointStatus =
  | "complete"
  | "too-many-points-to-find"
  | "too-many-points-to-run-analysis"
  | "unknown-error";

export type HitPointsAndStatusTuple = [TimeStampedPoint[], HitPointStatus];
export interface SourceLocationRange {
  start: SourceLocation;
  end: SourceLocation;
}

export interface ReplayClientInterface {
  get loadedRegions(): LoadedRegions | null;
  addEventListener(type: ReplayClientEvents, handler: Function): void;
  breakpointAdded(point: Point): Promise<BreakpointId>;
  breakpointRemoved(breakpointId: BreakpointId): Promise<void>;
  configure(sessionId: string): void;
  createPause(executionPoint: ExecutionPoint): Promise<createPauseResult>;
  evaluateExpression(
    pauseId: PauseId,
    expression: string,
    frameId: FrameId | null
  ): Promise<EvaluationResult>;
  findKeyboardEvents(onKeyboardEvents: (events: keyboardEvents) => void): Promise<void>;
  findMessages(focusRange: TimeStampedPointRange | null): Promise<{
    messages: Message[];
    overflow: boolean;
  }>;
  findNavigationEvents(onKeyboardEvents: (events: navigationEvents) => void): Promise<void>;
  findSources(): Promise<Source[]>;
  getAllFrames(pauseId: PauseId): Promise<PauseData>;
  getAnnotationKinds(): Promise<string[]>;
  getBreakpointPositions(
    sourceId: SourceId,
    range: SourceLocationRange | null
  ): Promise<SameLineSourceLocations[]>;
  getEventCountForTypes(eventTypes: EventHandlerType[]): Promise<Record<string, number>>;
  getEventCountForType(eventType: EventHandlerType): Promise<number>;
  getHitPointsForLocation(
    focusRange: TimeStampedPointRange | null,
    location: Location,
    condition: string | null
  ): Promise<HitPointsAndStatusTuple>;
  getMappedLocation(location: Location): Promise<MappedLocation>;
  getObjectWithPreview(
    objectId: ObjectId,
    pauseId: PauseId,
    level?: ObjectPreviewLevel
  ): Promise<PauseData>;
  getObjectProperty(objectId: ObjectId, pauseId: PauseId, propertyName: string): Promise<Result>;
  getPointNearTime(time: number): Promise<TimeStampedPoint>;
  getPointsBoundingTime(time: number): Promise<PointsBoundingTime>;
  getPreferredLocation(locations: Location[]): Location | null;
  getRecordingCapabilities(): Promise<RecordingCapabilities>;
  getRecordingId(): RecordingId | null;
  getSessionEndpoint(sessionId: SessionId): Promise<TimeStampedPoint>;
  getSessionId(): SessionId | null;
  getSourceContents(sourceId: SourceId): Promise<{ contents: string; contentType: ContentType }>;
  getSourceHitCounts(
    sourceId: SourceId,
    locationRange: SourceLocationRange,
    sourceLocations: SameLineSourceLocations[],
    focusRange: PointRange | null
  ): Promise<Map<number, LineHits>>;
  initialize(recordingId: string, accessToken: string | null): Promise<SessionId>;
  loadRegion(range: TimeRange, duration: number): Promise<void>;
  removeEventListener(type: ReplayClientEvents, handler: Function): void;
  runAnalysis<Result>(analysisParams: RunAnalysisParams): Promise<Result[]>;
  searchFunctions(
    opts: {
      query: string;
      sourceIds?: string[];
    },
    onMatches: (matches: FunctionMatch[]) => void
  ): Promise<void>;
  searchSources(
    opts: {
      query: string;
      sourceIds?: string[];
    },
    onMatches: (matches: SearchSourceContentsMatch[]) => void
  ): Promise<void>;
}
