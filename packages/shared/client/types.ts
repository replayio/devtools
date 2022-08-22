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
} from "@replayio/protocol";
import { AnalysisParams } from "protocol/analysisManager";

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

export type ReplayClientEvents = "loadedRegionsChange";

export interface ReplayClientInterface {
  get loadedRegions(): LoadedRegions | null;
  addEventListener(type: ReplayClientEvents, handler: Function): void;
  configure(sessionId: string): void;
  createPause(executionPoint: ExecutionPoint): Promise<createPauseResult>;
  evaluateExpression(
    pauseId: PauseId,
    expression: string,
    frameId: FrameId | null
  ): Promise<EvaluationResult>;
  findMessages(focusRange: TimeStampedPointRange | null): Promise<{
    messages: Message[];
    overflow: boolean;
  }>;
  findSources(): Promise<Source[]>;
  getAllFrames(pauseId: PauseId): Promise<PauseData>;
  getAnnotationKinds(): Promise<string[]>;
  getEventCountForTypes(eventTypes: EventHandlerType[]): Promise<Record<string, number>>;
  getEventCountForType(eventType: EventHandlerType): Promise<number>;
  getHitPointsForLocation(
    focusRange: TimeStampedPointRange | null,
    location: Location,
    condition: string | null
  ): Promise<TimeStampedPoint[]>;
  getObjectWithPreview(
    objectId: ObjectId,
    pauseId: PauseId,
    level?: ObjectPreviewLevel
  ): Promise<PauseData>;
  getPointNearTime(time: number): Promise<TimeStampedPoint>;
  getRecordingId(): RecordingId | null;
  getSessionEndpoint(sessionId: SessionId): Promise<TimeStampedPoint>;
  getSessionId(): SessionId | null;
  getSourceContents(sourceId: SourceId): Promise<{ contents: string; contentType: ContentType }>;
  getSourceHitCounts(sourceId: SourceId): Promise<Map<number, LineHits>>;
  initialize(recordingId: string, accessToken: string | null): Promise<SessionId>;
  loadRegion(range: TimeRange, duration: number): Promise<void>;
  removeEventListener(type: ReplayClientEvents, handler: Function): void;
  runAnalysis<Result>(analysisParams: AnalysisParams): Promise<Result[]>;
  searchSources(
    opts: {
      query: string;
      sourceIds?: string[];
    },
    onMatches: (matches: SearchSourceContentsMatch[]) => void
  ): Promise<void>;
}
