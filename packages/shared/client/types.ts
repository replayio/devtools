import {
  BreakpointId,
  ContentType,
  Result as EvaluationResult,
  EventHandlerType,
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
  PauseId,
  PointRange,
  getPointsBoundingTimeResult as PointsBoundingTime,
  RecordingId,
  Result,
  SameLineSourceLocations,
  SearchSourceContentsMatch,
  SessionId,
  newSource as Source,
  SourceId,
  SourceLocation,
  TimeRange,
  TimeStampedPoint,
  TimeStampedPointRange,
  createPauseResult,
  keyboardEvents,
  navigationEvents,
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

export type PointId = string;
export type Badge = "blue" | "green" | "orange" | "purple" | "unicorn" | "yellow";
export type Point = {
  badge: Badge | null;
  condition: string | null;
  content: string;
  createdAtTime: number;
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

export type HitPointsAndStatusTuple = [points: TimeStampedPoint[], status: HitPointStatus];
export interface SourceLocationRange {
  start: SourceLocation;
  end: SourceLocation;
}

export interface ReplayClientInterface {
  get loadedRegions(): LoadedRegions | null;
  addEventListener(type: ReplayClientEvents, handler: Function): void;
  breakpointAdded(location: Location, condition: string | null): Promise<BreakpointId[]>;
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
  ): Promise<LineNumberToHitCountMap>;
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
}
