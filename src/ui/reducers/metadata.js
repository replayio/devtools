import { prefs } from "ui/utils/prefs";

function initialTimelineState() {
  return {
    comments: [],
    user: prefs.user,
    users: [],
    title: "",
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

    case "update_title": {
      return { ...state, title: action.title };
    }

    default: {
      return state;
    }
  }
}

export const getComments = state => state.metadata.comments;
export const getUser = state => state.metadata.user;
export const getUsers = state => state.metadata.users;
export const getTitle = state => state.metadata.title;
export const commentVisible = state => getComments(state).some(comment => comment.visible);
