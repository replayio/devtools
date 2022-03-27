import { RecordingId } from "@recordreplay/protocol";
import { User } from "ui/types";

export interface CommentsState {
  pendingComments: Comment[];
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
  networkRequestId: string | null;
  primaryLabel?: string;
  replies: Reply[];
  secondaryLabel?: string;
}

export interface Reply extends Remark {
  parentId: string;
}

export type PendingComment =
  | {
      comment: Comment;
      type: "new_comment";
    }
  | {
      comment: Reply;
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
