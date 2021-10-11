import { CommentsState, PendingComment } from "ui/state/comments";
import { CommentsAction } from "ui/actions/comments";
import { UIState } from "ui/state";
import cloneDeep from "lodash/cloneDeep";

function initialCommentsState(): CommentsState {
  return {
    hoveredComment: null,
    pendingComment: null,
    shouldShowLoneEvents: true,
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

    case "update_pending_comment_content": {
      if (!state.pendingComment) {
        return state;
      }

      // Using cloneDeep instead of copying with destructure syntax
      // to keep TS happy.
      const newPendingComment = cloneDeep(state.pendingComment);
      newPendingComment.comment.content = action.content;

      return {
        ...state,
        pendingComment: newPendingComment,
      };
    }

    default: {
      return state;
    }
  }
}

export const getPendingComment = (state: UIState) => state.comments.pendingComment;
export const getHoveredComment = (state: UIState) => state.comments.hoveredComment;
export const getShouldShowLoneEvents = (state: UIState) => state.comments.shouldShowLoneEvents;
