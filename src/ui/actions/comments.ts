import { Action } from "redux";
import { selectors } from "ui/reducers";
import { PendingComment } from "ui/state/comments";
import { UIThunkAction } from ".";

type SetPendingComment = Action<"set_pending_comment"> & { comment: PendingComment | null };
type SetCommentPointer = Action<"set_comment_pointer"> & { value: boolean };
type SetHoveredComment = Action<"set_hovered_comment"> & { comment: any };
type SetActiveComment = Action<"set_active_comment"> & { comment: any };
type SetShouldShowLoneEvents = Action<"set_should_show_lone_events"> & { value: boolean };

export type CommentsAction =
  | SetPendingComment
  | SetCommentPointer
  | SetHoveredComment
  | SetActiveComment
  | SetShouldShowLoneEvents;

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

export function clearPendingComment(): SetPendingComment {
  return { type: "set_pending_comment", comment: null };
}

export function toggleShowLoneEvents(): UIThunkAction {
  return ({ dispatch, getState }) => {
    const newValue = !selectors.getShouldShowLoneEvents(getState());
    dispatch({ type: "set_should_show_lone_events", value: newValue });
  };
}
