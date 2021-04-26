import { RecordingId, MouseEvent } from "@recordreplay/protocol";

export interface CommentsState {
  pendingComment: PendingComment | null;
  hoveredComment: any;
  shouldShowLoneEvents: boolean;
  floatingItem: FloatingItem | null;
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

interface User {
  picture: string;
  name: string;
  id: string;
}

export interface FloatingItem {
  itemType: "pause";
  time: number;
  point: string;
  hasFrames: boolean;
  location?: SourceLocation;
}

export interface Comment {
  content: string;
  createdAt: string;
  hasFrames: boolean;
  sourceLocation: SourceLocation | null;
  id: string;
  point: string;
  recording_id: RecordingId;
  time: number;
  updatedAt: string;
  user: User;
  replies: Reply[];
  __typename: string;
  position: CommentPosition;
  parentId: null;
}

export interface Reply {
  content: string;
  createdAt: string;
  hasFrames: boolean;
  sourceLocation: SourceLocation | null;
  id: string;
  point: string;
  recording_id: RecordingId;
  time: number;
  updatedAt: string;
  user: User;
  __typename: string;
  position: null;
  parentId: string;
}

export interface Event extends MouseEvent {
  comment?: Comment;
}

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
  position: CommentPosition | null;
}

export interface PendingNewReply extends PendingBlankComment {
  content: "";
  parentId: string;
}

export interface PendingEditComment extends PendingBlankComment {
  position?: null;
  parentId?: null;
  id: string;
}

export interface PendingEditReply extends PendingBlankComment {
  position: null;
  parentId: string;
  id: string;
}

export interface PendingBlankComment {
  content: string;
  time: number;
  point: string;
  hasFrames: boolean;
  sourceLocation: SourceLocation | null;
}
