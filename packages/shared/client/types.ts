import {
  Message,
  newSource as Source,
  ObjectId,
  ObjectPreviewLevel,
  PauseData,
  PauseId,
  SessionId,
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
  getSessionId(): SessionId | null;
  initialize(recordingId: string, accessToken: string | null): Promise<SessionId>;
  findMessages(focusRange: TimeStampedPointRange | null): Promise<{
    messages: Message[];
    overflow: boolean;
  }>;
  findSources(): Promise<Source[]>;
  getObjectWithPreview(
    objectId: ObjectId,
    pauseId: PauseId,
    level?: ObjectPreviewLevel
  ): Promise<PauseData>;
  getPointNearTime(time: number): Promise<TimeStampedPoint>;
  getSessionEndpoint(sessionId: SessionId): Promise<TimeStampedPoint>;
}
