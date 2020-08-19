import { prefs } from "ui/utils/prefs";

function initialTimelineState() {
  return {
    comments: [],
    user: prefs.user,
    users: [],
  };
}

export default function update(state = initialTimelineState(), action) {
  switch (action.type) {
    case "set_comments": {
      return { ...state, comments: action.comments };
    }

    case "register_user": {
      return { ...state, user: action.user };
    }
    case "update_users": {
      return { ...state, users: action.users };
    }

    default: {
      return state;
    }
  }
}

export function getComments(state) {
  return state.metadata.comments;
}

export function getUser(state) {
  return state.metadata.user;
}

export function getUsers(state) {
  return state.metadata.users;
}

export function commentVisible(state) {
  return getComments(state).some(comment => comment.visible);
}
