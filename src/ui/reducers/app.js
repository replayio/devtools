function initialAppState() {
  return {
    theme: "theme-light",
    tooltip: null,
  };
}

export default function update(state = initialAppState(), action) {
  switch (action.type) {
    case "update_theme": {
      return { ...state, theme: action.theme };
    }
    case "update_tooltip": {
      return { ...state, tooltip: action.tooltip };
    }

    default: {
      return state;
    }
  }
}

export function getTheme(state) {
  return state.app.theme;
}

export function getTooltip(state) {
  return state.app.tooltip;
}
