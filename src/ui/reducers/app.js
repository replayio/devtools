function initialAppState() {
  return {
    theme: "theme-light",
  };
}

export default function update(state = initialAppState(), action) {
  switch (action.type) {
    case "update_theme": {
      return { ...state, theme: action.theme };
    }
    default: {
      return state;
    }
  }
}

export function getTheme(state) {
  return state.app.theme;
}
