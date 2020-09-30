import { prefs } from "../utils/prefs";

function initialAppState() {
  return {
    recordingId: null,
    errorMessage: null,
    theme: "theme-light",
    splitConsoleOpen: prefs.splitConsole,
    selectedPanel: prefs.selectedPanel,
    tooltip: null,
    loading: 4,
    sessionId: null,
  };
}

export default function update(state = initialAppState(), action) {
  switch (action.type) {
    case "setup_app": {
      return { ...state, recordingId: action.recordingId };
    }

    case "set_error_message": {
      return { ...state, errorMessage: action.message };
    }

    case "update_theme": {
      return { ...state, theme: action.theme };
    }

    case "set_selected_panel": {
      return { ...state, selectedPanel: action.panel };
    }

    case "set_split_console": {
      return { ...state, splitConsoleOpen: action.splitConsole };
    }

    case "loading": {
      return { ...state, loading: action.loading };
    }

    case "set_session_id": {
      return { ...state, sessionId: action.sessionId };
    }

    default: {
      return state;
    }
  }
}

export const getTheme = state => state.app.theme;
export const isSplitConsoleOpen = state => state.app.splitConsoleOpen;
export const getSelectedPanel = state => state.app.selectedPanel;
export const getLoading = state => state.app.loading;
export const getRecordingId = state => state.app.recordingId;
export const getSessionId = state => state.app.sessionId;
export const getErrorMessage = state => state.app.errorMessage;
