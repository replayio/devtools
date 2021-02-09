import { Action } from "redux";
import { PendingComment } from "ui/state/comments";

type SetPendingComment = Action<"set_pending_comment"> & { comment: PendingComment };
type SetCommentPointer = Action<"set_comment_pointer"> & { value: boolean };
type SetHoveredComment = Action<"set_hovered_comment"> & { comment: any };
type SetActiveComment = Action<"set_active_comment"> & { comment: any };

export type CommentsAction =
  | SetPendingComment
  | SetCommentPointer
  | SetHoveredComment
  | SetActiveComment;

export function setPendingComment(comment: PendingComment): SetPendingComment {
  return { type: "set_pending_comment", comment };
}

export function setCommentPointer(value: boolean): SetCommentPointer {
  return { type: "set_comment_pointer", value };
}

export function setActiveComment(comment: any): SetActiveComment {
  return { type: "set_active_comment", comment };
}

export function setHoveredComment(comment: any): SetHoveredComment {
  return { type: "set_hovered_comment", comment };
}

export function clearPendingComment() {
  return { type: "set_pending_comment", comment: null };
}
