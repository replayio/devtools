import { RecordingId, MouseEvent } from "@recordreplay/protocol";

export interface CommentsState {
  pendingComment: PendingComment | null;
  commentPointer: boolean;
  hoveredComment: any;
  activeComment: any;
  shouldShowLoneEvents: boolean;
}

interface SourceLocation {
  sourceUrl: string;
  line: number;
  column: number;
}

interface CommentPosition {
  x: number;
  y: number;
}

export interface PendingComment {
  content: "";
  recording_id: RecordingId | null;
  time: number;
  point: string;
  has_frames: boolean;
  source_location: SourceLocation | null;
  position: CommentPosition | null;
  id?: string;
}

export interface Comment {
  content: string;
  created_at: string;
  has_frames: boolean;
  source_location: SourceLocation | null;
  id: string;
  point: string;
  recording_id: RecordingId;
  parent_id: string;
  time: number;
  updated_at: string;
  user_id: string;
  __typename: string;
  position: CommentPosition;
}

export interface Event extends MouseEvent {
  comment?: Comment;
}
