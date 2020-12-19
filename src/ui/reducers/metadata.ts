import { MetadataAction } from "ui/actions/metadata";
import { UIState } from "ui/state";
import { MetadataState } from "ui/state/metadata";
const { prefs } = require("ui/utils/prefs");

function initialMetadataState(): MetadataState {
  return {
    comments: [],
    user: prefs.user,
    users: [],
    focusedCommentId: null,
  };
}

export default function update(
  state: MetadataState = initialMetadataState(),
  action: MetadataAction
): MetadataState {
  switch (action.type) {
    case "register_user": {
      return { ...state, user: action.user };
    }

    case "update_users": {
      return { ...state, users: action.users };
    }

    case "set_focused_comment_id": {
      return { ...state, focusedCommentId: action.id };
    }

    default: {
      return state;
    }
  }
}

export function getUser(state: UIState) {
  return state.metadata.user;
}

export function getUsers(state: UIState) {
  return state.metadata.users;
}

export function getFocusedCommentId(state: UIState) {
  return state.metadata.focusedCommentId;
}

export function hasFocusedComment(state: UIState) {
  return state.metadata.focusedCommentId !== null;
}
