import { CommentsState } from "ui/state/comments";
import { CommentsAction } from "ui/actions/comments";
import { UIState } from "ui/state";

function initialCommentsState(): CommentsState {
  return {
    commentPointer: false,
    hoveredComment: null,
    pendingComment: null,
    shouldShowLoneEvents: true,
    floatingItem: null,
  };
}

export default function update(
  state = initialCommentsState(),
  action: CommentsAction
): CommentsState {
  switch (action.type) {
    case "set_pending_comment": {
      return {
        ...state,
        pendingComment: action.comment,
      };
    }

    case "set_comment_pointer": {
      return {
        ...state,
        commentPointer: action.value,
      };
    }

    case "set_hovered_comment": {
      return {
        ...state,
        hoveredComment: action.comment,
      };
    }

    case "set_should_show_lone_events": {
      return {
        ...state,
        shouldShowLoneEvents: action.value,
      };
    }

    case "set_floating_item": {
      return {
        ...state,
        floatingItem: action.floatingItem,
      };
    }

    default: {
      return state;
    }
  }
}

export const getPendingComment = (state: UIState) => state.comments.pendingComment;
export const getCommentPointer = (state: UIState) => state.comments.commentPointer;
export const getHoveredComment = (state: UIState) => state.comments.hoveredComment;
export const getShouldShowLoneEvents = (state: UIState) => state.comments.shouldShowLoneEvents;
export const getFloatingItem = (state: UIState) => state.comments.floatingItem;
