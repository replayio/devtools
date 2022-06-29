import {
  ContentType,
  Message,
  newSource as Source,
  ObjectId,
  ObjectPreviewLevel,
  PauseData,
  PauseId,
  RecordingId,
  SessionId,
  SourceId,
  TimeStampedPoint,
  TimeStampedPointRange,
} from "@replayio/protocol";

export type LogEntry = {
  args: any[];
  isAsync: boolean;
  method: string;
  result: any;
};

export interface ReplayClientInterface {
  configure(sessionId: string): void;
  getPauseIdForMessage(message: Message): PauseId;
  getRecordingId(): RecordingId | null;
  getSessionId(): SessionId | null;
  initialize(recordingId: string, accessToken: string | null): Promise<SessionId>;
  findMessages(focusRange: TimeStampedPointRange | null): Promise<{
    messages: Message[];
    overflow: boolean;
  }>;
  findSources(): Promise<Source[]>;
  getAllFrames(pauseId: PauseId): Promise<PauseData>;
  getObjectWithPreview(
    objectId: ObjectId,
    pauseId: PauseId,
    level?: ObjectPreviewLevel
  ): Promise<PauseData>;
  getPointNearTime(time: number): Promise<TimeStampedPoint>;
  getSessionEndpoint(sessionId: SessionId): Promise<TimeStampedPoint>;
  getSourceContents(sourceId: SourceId): Promise<{ contents: string; contentType: ContentType }>;
}
