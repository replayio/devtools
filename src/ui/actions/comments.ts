import { Action } from "redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { PendingComment, Event, Comment, Reply, FloatingItem } from "ui/state/comments";
import { UIThunkAction } from ".";
import { ThreadFront } from "protocol/thread";
import isEqual from "lodash/isEqual";

type SetPendingComment = Action<"set_pending_comment"> & { comment: PendingComment | null };
type SetCommentPointer = Action<"set_comment_pointer"> & { value: boolean };
type SetHoveredComment = Action<"set_hovered_comment"> & { comment: any };
type SetShouldShowLoneEvents = Action<"set_should_show_lone_events"> & { value: boolean };
type SetFloatingItem = Action<"set_floating_item"> & {
  floatingItem: FloatingItem | null;
};

export type CommentsAction =
  | SetPendingComment
  | SetCommentPointer
  | SetHoveredComment
  | SetShouldShowLoneEvents
  | SetFloatingItem;

export function setPendingComment(comment: PendingComment): SetPendingComment {
  return { type: "set_pending_comment", comment };
}

export function setCommentPointer(value: boolean): SetCommentPointer {
  return { type: "set_comment_pointer", value };
}

export function setHoveredComment(comment: any): SetHoveredComment {
  return { type: "set_hovered_comment", comment };
}

export function clearPendingComment(): SetPendingComment {
  return { type: "set_pending_comment", comment: null };
}

export function setFloatingItem(floatingItem: FloatingItem | null): SetFloatingItem {
  return { type: "set_floating_item", floatingItem };
}

export function toggleShowLoneEvents(): UIThunkAction {
  return ({ dispatch, getState }) => {
    const newValue = !selectors.getShouldShowLoneEvents(getState());
    dispatch({ type: "set_should_show_lone_events", value: newValue });
  };
}

export function showFloatingItem(): UIThunkAction {
  return async ({ dispatch, getState }) => {
    const initialFloatingItem = selectors.getFloatingItem(getState());

    const newFloatingItem: FloatingItem = {
      itemType: "pause",
      time: selectors.getCurrentTime(getState()),
      point: ThreadFront.currentPoint,
      has_frames: ThreadFront.currentPointHasFrames,
      location: await ThreadFront.getCurrentPauseSourceLocation(),
    };

    const currentFloatingItem = selectors.getFloatingItem(getState());

    // We should bail if the newFloatingItem is now stale. This happens in cases where
    // the state's floatingItem changes while we wait for the newFloatingItem to resolve.
    if (initialFloatingItem !== currentFloatingItem) {
      return;
    }

    if (isEqual(currentFloatingItem, newFloatingItem)) {
      return;
    }

    dispatch(setFloatingItem(newFloatingItem));
  };
}

export function hideFloatingItem(): UIThunkAction {
  return async ({ dispatch }) => {
    dispatch(setFloatingItem(null));
  };
}

export function replyToItem(item: Event | Comment | FloatingItem): UIThunkAction {
  return async ({ dispatch, getState }) => {
    const { point, time } = item;
    const state = getState();
    const canvas = selectors.getCanvas(state);
    const recordingTarget = selectors.getRecordingTarget(state);

    if ("has_frames" in item) {
      dispatch(actions.seek(point, time, item.has_frames));
    } else {
      dispatch(actions.seek(point, time, false));
    }

    if ("comment" in item && item.comment && "id" in item.comment) {
      // Add a reply to an event's comment.
      const pendingComment: PendingComment = {
        type: "new_reply",
        comment: {
          content: "",
          time,
          point,
          has_frames: false,
          source_location: null,
          parent_id: item.comment.id,
        },
      };

      dispatch(setPendingComment(pendingComment));
    } else if ("id" in item) {
      // Add a reply to a non-event's comment.
      const pendingComment: PendingComment = {
        type: "new_reply",
        comment: {
          content: "",
          time,
          point,
          has_frames: "has_frames" in item && item.has_frames,
          source_location: null,
          parent_id: item.id,
        },
      };

      dispatch(setPendingComment(pendingComment));
    } else {
      const position =
        recordingTarget == "node"
          ? null
          : {
              x: canvas!.width * 0.5,
              y: canvas!.height * 0.5,
            };

      // Add a new comment to an event or a temporary pause item.
      const pendingComment: PendingComment = {
        type: "new_comment",
        comment: {
          content: "",
          time,
          point,
          has_frames: "has_frames" in item && item.has_frames,
          source_location: (await ThreadFront.getCurrentPauseSourceLocation()) || null,
          position,
        },
      };

      dispatch(setPendingComment(pendingComment));
    }
  };
}

export function createComment(
  time: number,
  point: string,
  position: { x: number; y: number }
): UIThunkAction {
  return async ({ dispatch, getState }) => {
    const pendingComment: PendingComment = {
      type: "new_comment",
      comment: {
        content: "",
        time,
        point,
        has_frames: ThreadFront.currentPointHasFrames,
        source_location: (await ThreadFront.getCurrentPauseSourceLocation()) || null,
        position,
      },
    };

    dispatch(setPendingComment(pendingComment));
  };
}

export function editItem(item: Comment | Reply): UIThunkAction {
  return async ({ dispatch }) => {
    const { point, time, has_frames } = item;

    if ("has_frames" in item) {
      dispatch(actions.seek(point, time, item.has_frames));
    } else {
      dispatch(actions.seek(point, time, false));
    }

    if (item.parent_id !== null) {
      const { content, source_location, parent_id, position, id } = item;

      // Editing a reply.
      const pendingComment: PendingComment = {
        type: "edit_reply",
        comment: { content, time, point, has_frames, source_location, parent_id, position, id },
      };
      dispatch(setPendingComment(pendingComment));
    } else {
      const { content, source_location, parent_id, position, id } = item;

      // Editing a comment.
      const pendingComment: PendingComment = {
        type: "edit_comment",
        comment: { content, time, point, has_frames, source_location, parent_id, position, id },
      };
      dispatch(setPendingComment(pendingComment));
    }
  };
}
