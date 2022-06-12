import { CommentsAction } from "ui/actions/comments";
import { UIState } from "ui/state";
import { CommentsState } from "ui/state/comments";

export default function update(
  state: CommentsState = {
    hoveredComment: null,
  },
  action: CommentsAction
): CommentsState {
  switch (action.type) {
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

export const getHoveredComment = (state: UIState) => state.comments.hoveredComment;
