import { CommentsState, ROOT_COMMENT_ID } from "ui/state/comments";
import { CommentsAction } from "ui/actions/comments";
import { UIState } from "ui/state";

export const PENDING_COMMENT_ID = "PENDING";

function initialCommentsState(): CommentsState {
  return {
    hoveredComment: null,
    pendingCommentsDataExtras: {},
    existingCommentsDataExtras: {},
  };
}

export default function update(
  state = initialCommentsState(),
  action: CommentsAction
): CommentsState {
  switch (action.type) {
    case "set_pending_comment_data": {
      const parentId = action.parentId ?? ROOT_COMMENT_ID;

      // clean up data
      if (action.data === null) {
        delete state.pendingCommentsDataExtras[parentId];
        return {
          ...state,
          pendingCommentsDataExtras: {
            ...state.pendingCommentsDataExtras,
          },
        };
      }

      // ...or actually set new pending comments data
      return {
        ...state,
        pendingCommentsDataExtras: {
          ...state.pendingCommentsDataExtras,
          [parentId]: action.data,
        },
      };
    }

    case "set_existing_comment_data": {
      // remove data
      if (action.data === null) {
        delete state.existingCommentsDataExtras[action.commentId];
        return {
          ...state,
          existingCommentsDataExtras: {
            ...state.existingCommentsDataExtras,
          },
        };
      }

      // ...or actually set some existing comments data
      return {
        ...state,
        existingCommentsDataExtras: {
          ...state.existingCommentsDataExtras,
          [action.commentId]: action.data,
        },
      };
    }

    case "set_hovered_comment": {
      return {
        ...state,
        hoveredComment: action.comment,
      };
    }

    default: {
      return state;
    }
  }
}

export const getPendingComment = (state: UIState) =>
  state.comments.pendingCommentsDataExtras[ROOT_COMMENT_ID];
export const getHoveredComment = (state: UIState) => state.comments.hoveredComment;
