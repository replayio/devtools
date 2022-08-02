import {
  ContentType,
  EventHandlerType,
  FrameId,
  KeyboardEvent,
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
  ExecutionPoint,
  createPauseResult,
  PointRange,
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

export interface ReplayClientInterface {
  configure(sessionId: string): void;
  createPause(executionPoint: ExecutionPoint): Promise<createPauseResult>;
  evaluateExpression(
    pauseId: PauseId,
    expression: string,
    frameId: FrameId | null
  ): Promise<EvaluationResult>;
  findMessages(focusRange: PointRange | null): Promise<{
    messages: Message[];
    overflow: boolean;
  }>;
  findSources(): Promise<Source[]>;
  getAllFrames(pauseId: PauseId): Promise<PauseData>;
  getEventCountForType(eventType: EventHandlerType): Promise<number>;
  getHitPointsForLocation(
    focusRange: PointRange | null,
    location: Location
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
  searchSources(
    opts: { query: string; sourceIds?: string[] },
    onMatches: (matches: SearchSourceContentsMatch[]) => void
  ): Promise<void>;
  initialize(recordingId: string, accessToken: string | null): Promise<SessionId>;
  runAnalysis<Result>(analysisParams: AnalysisParams): Promise<Result[]>;
}
