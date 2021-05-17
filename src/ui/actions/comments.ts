import { Action } from "redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { PendingComment, Event, Comment, Reply } from "ui/state/comments";
import { UIThunkAction } from ".";
import { ThreadFront } from "protocol/thread";
import { setSelectedPrimaryPanel } from "./app";

type SetPendingComment = Action<"set_pending_comment"> & { comment: PendingComment | null };
type SetHoveredComment = Action<"set_hovered_comment"> & { comment: any };
type SetShouldShowLoneEvents = Action<"set_should_show_lone_events"> & { value: boolean };

export type CommentsAction = SetPendingComment | SetHoveredComment | SetShouldShowLoneEvents;

export function setPendingComment(comment: PendingComment): SetPendingComment {
  return { type: "set_pending_comment", comment };
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

export function createComment(
  time: number,
  point: string,
  position: { x: number; y: number } | null
): UIThunkAction {
  return async ({ dispatch }) => {
    dispatch(setSelectedPrimaryPanel("comments"));

    const pendingComment: PendingComment = {
      type: "new_comment",
      comment: {
        content: "",
        time,
        point,
        hasFrames: ThreadFront.currentPointHasFrames,
        sourceLocation: (await ThreadFront.getCurrentPauseSourceLocation()) || null,
        position,
      },
    };

    dispatch(setPendingComment(pendingComment));
  };
}

export function editItem(item: Comment | Reply): UIThunkAction {
  return async ({ dispatch }) => {
    const { point, time, hasFrames } = item;

    dispatch(seekToComment(item));

    if (!("replies" in item)) {
      const { content, sourceLocation, parentId, position, id } = item;

      // Editing a reply.
      const pendingComment: PendingComment = {
        type: "edit_reply",
        comment: { content, time, point, hasFrames, sourceLocation, parentId, position, id },
      };
      dispatch(setPendingComment(pendingComment));
    } else {
      const { content, sourceLocation, id, position } = item;

      // Editing a comment.
      const pendingComment: PendingComment = {
        type: "edit_comment",
        comment: {
          content,
          time,
          point,
          hasFrames,
          sourceLocation,
          id,
          position,
        },
      };
      dispatch(setPendingComment(pendingComment));
    }
  };
}

export function seekToComment(item: Comment | Reply | Event): UIThunkAction {
  return ({ dispatch, getState }) => {
    dispatch(clearPendingComment());

    let cx = selectors.getThreadContext(getState());
    const hasFrames = "hasFrames" in item ? item.hasFrames : false;
    dispatch(actions.seek(item.point, item.time, hasFrames));
    if ("sourceLocation" in item && item.sourceLocation) {
      cx = selectors.getThreadContext(getState());
      dispatch(actions.selectLocation(cx, item.sourceLocation));
    }
  };
}

export function replyToComment(comment: Comment): UIThunkAction {
  return ({ dispatch }) => {
    const { time, point, hasFrames, id } = comment;
    const pendingComment: PendingComment = {
      type: "new_reply",
      comment: {
        content: "",
        time,
        point,
        hasFrames,
        sourceLocation: null,
        parentId: id,
      },
    };

    dispatch(setPendingComment(pendingComment));
  };
}
