function initialTimelineState() {
  return {
    comments: [],
  };
}

export default function update(state = initialTimelineState(), action) {
  switch (action.type) {
    case "set_comments": {
      return { ...state, comments: action.comments };
    }

    default: {
      return state;
    }
  }
}

export function getComments(state) {
  return state.metadata.comments;
}

export function commentVisible(state) {
  return getComments(state).some(comment => comment.visible);
}
