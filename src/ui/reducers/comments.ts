import { CommentsState } from "ui/state/comments";
import { CommentsAction } from "ui/actions/comments";
import { UIState } from "ui/state";
import cloneDeep from "lodash/cloneDeep";
import { getRecordingId } from "ui/utils/recording";
import { getReplaySession } from "ui/setup/prefs";

export async function getInitialCommentsState(): Promise<CommentsState> {
  const recordingId = getRecordingId()!;

  if (!recordingId) {
    return {
      hoveredComment: null,
      pendingComment: null,
    };
  }

  const session = await getReplaySession(recordingId);

  return {
    hoveredComment: null,
    pendingComment: session?.pendingComment || null,
  };
}

export default function update(
  state: CommentsState = {
    hoveredComment: null,
    pendingComment: null,
  },
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
