import {
  ContentType,
  EventHandlerType,
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
  SessionId,
  SourceId,
  SourceLocation,
  TimeStampedPoint,
  TimeStampedPointRange,
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
  findMessages(focusRange: TimeStampedPointRange | null): Promise<{
    messages: Message[];
    overflow: boolean;
  }>;
  findSources(): Promise<Source[]>;
  getAllFrames(pauseId: PauseId): Promise<PauseData>;
  getEventCountForType(eventType: EventHandlerType): Promise<number>;
  getHitPointsForLocation(location: Location): Promise<TimeStampedPoint[]>;
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
  runAnalysis<Result>(
    location: Location,
    timeStampedPoint: TimeStampedPoint,
    mapper: string
  ): Promise<Result>;
}
