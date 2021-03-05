import { RecordingId, MouseEvent } from "@recordreplay/protocol";

export interface CommentsState {
  pendingComment: PendingComment | null;
  commentPointer: boolean;
  hoveredComment: any;
  shouldShowLoneEvents: boolean;
}

export interface SourceLocation {
  sourceUrl: string;
  line: number;
  column: number;
  sourceId: string;
}

interface CommentPosition {
  x: number;
  y: number;
}

interface User {
  picture: string;
  name: string;
  id: string;
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
  user: User;
  __typename: string;
  position: CommentPosition;
  replies: Reply[];
}

export interface Reply extends Comment {
  parent_id: string;
}

export interface Event extends MouseEvent {
  comment?: Comment;
}

export type PauseItem = {
  time: number;
  itemType: "pause";
  point: string;
  has_frames: boolean;
};

// Pending Comments

export type PendingComment =
  | {
      type: "new_comment";
      comment: PendingNewComment;
    }
  | {
      type: "new_reply";
      comment: PendingNewReply;
    }
  | {
      type: "edit_comment";
      comment: PendingEditComment;
    }
  | {
      type: "edit_reply";
      comment: PendingEditReply;
    };

export interface PendingNewComment extends PendingBlankComment {
  content: "";
  position: CommentPosition;
}

export interface PendingNewReply extends PendingBlankComment {
  content: "";
  parent_id: string;
}

export interface PendingEditComment extends Comment {}

export interface PendingEditReply extends Comment {}

export interface PendingBlankComment {
  content: string;
  time: number;
  point: string;
  has_frames: boolean;
  source_location: SourceLocation | null;
}
