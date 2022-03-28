import { CommentsState } from "ui/state/comments";
import { CommentsAction } from "ui/actions/comments";
import { UIState } from "ui/state";

export const PENDING_COMMENT_ID = "PENDING";

function initialCommentsState(): CommentsState {
  return {
    hoveredComment: null,
    pendingComments: [],
  };
}

export default function update(
  state = initialCommentsState(),
  action: CommentsAction
): CommentsState {
  switch (action.type) {
    case "add_pending_comment": {
      return {
        ...state,
        pendingComments: [...state.pendingComments, action.comment],
      };
    }

    case "remove_pending_comment": {
      return {
        ...state,
        pendingComments: state.pendingComments.filter(x => x.id !== action.id),
      };
    }

    case "set_hovered_comment": {
      return {
        ...state,
        hoveredComment: action.comment,
      };
    }

    case "update_pending_comment": {
      return {
        ...state,
        pendingComments: [
          ...state.pendingComments.filter(x => x.id !== action.comment.id),
          action.comment,
        ],
      };
    }

    default: {
      return state;
    }
  }
}

export const getHoveredComment = (state: UIState) => state.comments.hoveredComment;
export const getPendingComments = (state: UIState) => state.comments.pendingComments;
