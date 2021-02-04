import { RecordingId } from "@recordreplay/protocol";

export interface CommentsState {
  pendingComment: PendingComment | null;
  commentPointer: boolean;
  hoveredComment: any;
}

export interface PendingComment {
  recording_id: RecordingId | null;
  time: number;
  point: string;
  has_frames: boolean;
  position: CommentPosition | null;
  id?: string;
}

interface CommentPosition {
  x: number;
  y: number;
}
