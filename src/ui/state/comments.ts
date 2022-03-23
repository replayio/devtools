import { RecordingId } from "@recordreplay/protocol";
import { User } from "ui/types";

export interface CommentsState {
  pendingComment: Comment | null;
  hoveredComment: any;
}

export interface SourceLocation {
  sourceUrl: string;
  line: number;
  column: number;
  sourceId: string;
}

export interface CommentPosition {
  x: number;
  y: number;
}

export type CommentOptions = {
  position: CommentPosition | null;
  hasFrames: boolean;
  sourceLocation: SourceLocation | null;
  networkRequestId?: string;
};

export interface Comment {
  id: string;
  point: string;
  createdAt: string;
  hasFrames: boolean;
  content: string;
  recordingId: RecordingId;
  time: number;
  updatedAt: string;
  user: User;
  parentId: string | null;
  replies: Comment[];
  position: CommentPosition | null;
  sourceLocation: SourceLocation | null;
  primaryLabel?: string;
  secondaryLabel?: string;
  networkRequestId: string;
}
