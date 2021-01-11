import { ExecutionPoint, SessionId } from "@recordreplay/protocol";

export interface User {
  id: string;
  avatarID: number;
  picture?: string;
  name?: string;
  heartbeat?: number;
}

export interface Comment {
  id: number;
  sessionId: SessionId;
  point: ExecutionPoint;
  hasFrames: boolean;
  time: number;
  contents: string;
  user: User;
}

export interface MetadataState {
  comments: Comment[];
  user: User;
  users: User[];
}
