import { AppState } from "ui/state/app";
import { AppActions } from "ui/actions/app";
import { UIState } from "ui/state";
import { SessionActions } from "ui/actions/session";
const { prefs } = require("../utils/prefs");
import { Location } from "@recordreplay/protocol";
import { getLocationAndConditionKey } from "devtools/client/debugger/src/utils/breakpoint";

function initialAppState(): AppState {
  return {
    recordingId: null,
    expectedError: null,
    unexpectedError: null,
    theme: "theme-light",
    splitConsoleOpen: prefs.splitConsole,
    selectedPanel: prefs.selectedPanel,
    selectedPrimaryPanel: "comments",
    initializedPanels: [],
    recordingDuration: 0,
    indexing: 0,
    loading: 4,
    uploading: null,
    sessionId: null,
    modal: null,
    modalOptions: null,
    analysisPoints: {},
    events: {},
    viewMode: prefs.viewMode,
    narrowMode: false,
    hoveredLineNumberLocation: null,
    isNodePickerActive: false,
    canvas: null,
    workspaceId: null,
    defaultSettingsTab: "Invitations",
    recordingTarget: null,
    fontLoading: true,
    recordingWorkspace: null,
    loadedRegions: null,
  };
}

export default function update(
  state = initialAppState(),
  action: AppActions | SessionActions
): AppState {
  switch (action.type) {
    case "setup_app": {
      return { ...state, recordingId: action.recordingId };
    }

    case "set_recording_duration": {
      return { ...state, recordingDuration: action.duration };
    }

    case "indexing": {
      return { ...state, indexing: action.indexing };
    }

    case "set_uploading": {
      return { ...state, uploading: action.uploading };
    }

    case "set_loaded_regions": {
      const recordingDuration = Math.max(
        ...action.parameters.loading.map(r => r.end),
        state.recordingDuration
      );
      return { ...state, loadedRegions: action.parameters, recordingDuration };
    }

    case "set_expected_error": {
      return { ...state, expectedError: action.error };
    }

    case "set_unexpected_error": {
      return { ...state, unexpectedError: action.error };
    }

    case "update_theme": {
      return { ...state, theme: action.theme };
    }

    case "set_selected_panel": {
      return { ...state, selectedPanel: action.panel };
    }

    case "set_selected_primary_panel": {
      return { ...state, selectedPrimaryPanel: action.panel };
    }

    case "set_initialized_panels": {
      return { ...state, initializedPanels: [...state.initializedPanels, action.panel] };
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

    case "set_modal": {
      return { ...state, modal: action.modal, modalOptions: action.options };
    }

    case "set_analysis_points": {
      const id = getLocationAndConditionKey(action.location, action.condition);

      return {
        ...state,
        analysisPoints: {
          ...state.analysisPoints,
          [id]: action.analysisPoints,
        },
      };
    }

    case "set_analysis_error": {
      const id = getLocationAndConditionKey(action.location, action.condition);

      return {
        ...state,
        analysisPoints: {
          ...state.analysisPoints,
          [id]: "error",
        },
      };
    }

    case "set_events": {
      return {
        ...state,
        events: {
          ...state.events,
          [action.eventType]: action.events,
        },
      };
    }

    case "set_view_mode": {
      return { ...state, viewMode: action.viewMode };
    }

    case "set_narrow_mode": {
      return {
        ...state,
        narrowMode: action.narrowMode,
      };
    }

    case "set_hovered_line_number_location": {
      return {
        ...state,
        hoveredLineNumberLocation: action.location,
      };
    }

    case "set_is_node_picker_active": {
      return {
        ...state,
        isNodePickerActive: action.active,
      };
    }

    case "set_canvas": {
      return {
        ...state,
        canvas: action.canvas,
      };
    }

    case "set_workspace_id": {
      return { ...state, workspaceId: action.workspaceId };
    }

    case "set_default_settings_tab": {
      return { ...state, defaultSettingsTab: action.tabTitle };
    }

    case "set_recording_target": {
      return { ...state, recordingTarget: action.recordingTarget };
    }

    case "set_material_icons_loaded": {
      return { ...state, fontLoading: action.fontLoading };
    }

    case "set_recording_workspace": {
      return { ...state, recordingWorkspace: action.workspace };
    }

    default: {
      return state;
    }
  }
}

export const getTheme = (state: UIState) => state.app.theme;
export const isSplitConsoleOpen = (state: UIState) => state.app.splitConsoleOpen;
export const getSelectedPanel = (state: UIState) => state.app.selectedPanel;
export const isInspectorSelected = (state: UIState) =>
  getViewMode(state) === "dev" && getSelectedPanel(state) == "inspector";
export const getSelectedPrimaryPanel = (state: UIState) => state.app.selectedPrimaryPanel;
export const getInitializedPanels = (state: UIState) => state.app.initializedPanels;
export const getRecordingDuration = (state: UIState) => state.app.recordingDuration;
export const getIndexing = (state: UIState) => state.app.indexing;
export const getIndexed = (state: UIState) => state.app.indexing == 100;
export const getLoading = (state: UIState) => state.app.loading;
export const getLoadedRegions = (state: UIState) => state.app.loadedRegions;
export const getUploading = (state: UIState) => state.app.uploading;
export const getRecordingId = (state: UIState) => state.app.recordingId;
export const getSessionId = (state: UIState) => state.app.sessionId;
export const getExpectedError = (state: UIState) => state.app.expectedError;
export const getUnexpectedError = (state: UIState) => state.app.unexpectedError;
export const getModal = (state: UIState) => state.app.modal;
export const getModalOptions = (state: UIState) => state.app.modalOptions;
export const getAnalysisPoints = (state: UIState) => state.app.analysisPoints;
export const getAnalysisPointsForLocation = (
  state: UIState,
  location: Location | null,
  condition = ""
) => {
  if (!location) return;
  return state.app.analysisPoints[getLocationAndConditionKey(location, condition)];
};
export const getViewMode = (state: UIState) => state.app.viewMode;
export const getNarrowMode = (state: UIState) => state.app.narrowMode;
export const getHoveredLineNumberLocation = (state: UIState) => state.app.hoveredLineNumberLocation;
export const getPointsForHoveredLineNumber = (state: UIState) => {
  const location = getHoveredLineNumberLocation(state);
  return getAnalysisPointsForLocation(state, location);
};
const NO_EVENTS: MouseEvent[] = [];
export const getEventsForType = (state: UIState, type: string) =>
  state.app.events[type] || NO_EVENTS;
export const getIsNodePickerActive = (state: UIState) => state.app.isNodePickerActive;
export const getCanvas = (state: UIState) => state.app.canvas;
export const getWorkspaceId = (state: UIState) => state.app.workspaceId;
export const getDefaultSettingsTab = (state: UIState) => state.app.defaultSettingsTab;
export const getRecordingTarget = (state: UIState) => state.app.recordingTarget;
export const getFontLoading = (state: UIState) => state.app.fontLoading;
export const getRecordingWorkspace = (state: UIState) => state.app.recordingWorkspace;
