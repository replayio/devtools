import { RecordingId } from "@recordreplay/protocol";
import { User } from "ui/types";

export interface CommentsState {
  pendingComment: PendingComment | null;
  hoveredComment: any;
  shouldShowLoneEvents: boolean;
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

export interface Remark {
  content: string;
  createdAt: string;
  hasFrames: boolean;
  id: string;
  point: string;
  recordingId: RecordingId;
  sourceLocation: SourceLocation | null;
  time: number;
  updatedAt: string;
  user: User;
}

export interface Comment extends Remark {
  position: CommentPosition | null;
  primaryLabel?: string;
  replies: Reply[];
  secondaryLabel?: string;
}

export interface Reply extends Remark {
  parentId: string;
}

export type PendingComment =
  | {
      comment: PendingNewComment;
      type: "new_comment";
    }
  | {
      comment: PendingNewReply;
      type: "new_reply";
    }
  | {
      comment: Comment;
      type: "edit_comment";
    }
  | {
      comment: Reply;
      type: "edit_reply";
    };

export type PendingCommentAction = "edit_reply" | "edit_comment" | "new_reply" | "new_comment";

export type PendingNewComment = Omit<Comment, "recordingId" | "user">;
export type PendingNewReply = Omit<Reply, "recordingId" | "user">;
