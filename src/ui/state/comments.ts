import { RecordingId } from "@recordreplay/protocol";
import { JSONContent } from "@tiptap/react";
import { User } from "ui/types";

export const ROOT_COMMENT_ID = "recording";

export interface CommentsState {
  // pending comments data is an additional contextual data for every specific
  // comment that hasn't yet been submitted.
  //
  // every comment can have one active "pending" (aka unsubmitted) reply comment,
  // so this map maps information of type "for every parent comment, this is its
  // reply's contextual data that will be used when submitting a comment".
  //
  // this data exists and is only useful only until the comment is submitted,
  // after that, the comment data will be within the comment itself.
  //
  // the special value of "recording" for the key of its parent represents the
  // non-existing, inferred root comment for the entire recording. the replies
  // of this inferred root comment and actually the top-level comments on the
  // recording itself (and not replies)
  pendingCommentsDataExtras: {
    [parentId: Comment["id"] | typeof ROOT_COMMENT_ID]: PendingCommentDataExtras;
  };
  existingCommentsDataExtras: {
    [commentId: Comment["id"]]: ExistingCommentDataExtras;
  };
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

export type ExistingCommentDataExtras = Pick<Comment, "position">;

export type PendingCommentDataExtras = Pick<
  Comment,
  | "hasFrames"
  | "position"
  | "networkRequestId"
  | "sourceLocation"
  | "point"
  | "time"
  | "primaryLabel"
  | "secondaryLabel"
>;

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
  parentId: Comment["id"] | null;
  replies: Comment[];
  position: CommentPosition | null;
  sourceLocation: SourceLocation | null;
  primaryLabel?: string;
  secondaryLabel?: string;
  networkRequestId: string | null;
}
