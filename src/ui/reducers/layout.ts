import { UIState } from "ui/state";
import { LayoutState, PanelName } from "ui/state/layout";
import { LayoutActions } from "ui/actions/layout";
import { prefs } from "../utils/prefs";
import { getRecordingId } from "ui/utils/environment";
import { trackEvent } from "ui/utils/telemetry";
import { asyncStore } from "../utils/prefs";
import { getRecording } from "ui/hooks/recordings";

const syncInitialLayoutState: LayoutState = {
  canvas: null,
  defaultSettingsTab: "Personal",
  loadingPageTipIndex: 0,
  modal: null,
  modalOptions: null,
  selectedPanel: prefs.selectedPanel as PanelName,
  selectedPrimaryPanel: "events",
  showCommandPalette: false,
  showEditor: true,
  showVideoPanel: true,
  theme: "theme-light",
  viewMode: "non-dev",
};

const getDefaultSelectedPrimaryPanel = (comments: Comment, session?: any) => {
  if (session) {
    return session.selectedPrimaryPanel;
  }

  if (comments.length) {
    return "comments";
  } else {
    return syncInitialLayoutState.selectedPrimaryPanel;
  }
};

export async function getInitialLayoutState(): Promise<LayoutState> {
  const recordingId = getRecordingId();

  // If we're in the library, there are no preferences to fetch.
  if (!recordingId) {
    return syncInitialLayoutState;
  }

  const recording = await getRecording(recordingId);

  if (!recording) {
    return syncInitialLayoutState;
  }

  const { comments } = recording;
  const replaySessions = await asyncStore.replaySessions;
  const session = replaySessions[recordingId!];

  if (!session) {
    return {
      ...syncInitialLayoutState,
      selectedPrimaryPanel: getDefaultSelectedPrimaryPanel(comments, session),
    };
  }

  const { selectedPrimaryPanel, showVideoPanel, showEditor, viewMode } = syncInitialLayoutState;

  const initialViewMode = session.viewMode || viewMode;
  trackEvent(initialViewMode == "dev" ? "layout.default_devtools" : "layout.default_viewer");

  return {
    ...syncInitialLayoutState,
    viewMode: initialViewMode,
    selectedPrimaryPanel: getDefaultSelectedPrimaryPanel(comments, session),
    showVideoPanel: "showVideoPanel" in session ? session.showVideoPanel : showVideoPanel,
    showEditor: "showEditor" in session ? session.showEditor : showEditor,
  };
}

export default function update(state = syncInitialLayoutState, action: LayoutActions): LayoutState {
  switch (action.type) {
    case "set_canvas": {
      return {
        ...state,
        canvas: action.canvas,
      };
    }

    case "set_default_settings_tab": {
      return { ...state, defaultSettingsTab: action.tabTitle };
    }

    case "set_show_command_palette": {
      return {
        ...state,
        showCommandPalette: action.value,
      };
    }

    case "set_show_video_panel": {
      return { ...state, showVideoPanel: action.showVideoPanel };
    }

    case "set_show_editor": {
      return { ...state, showEditor: action.showEditor };
    }

    case "set_loading_page_tip_index": {
      return { ...state, loadingPageTipIndex: action.index };
    }

    case "set_view_mode": {
      return { ...state, viewMode: action.viewMode };
    }

    case "set_modal": {
      return { ...state, modal: action.modal, modalOptions: action.options };
    }

    case "set_selected_primary_panel": {
      return { ...state, selectedPrimaryPanel: action.panel };
    }

    case "update_theme": {
      return { ...state, theme: action.theme };
    }

    case "set_selected_panel": {
      return { ...state, selectedPanel: action.panel };
    }

    default: {
      return state;
    }
  }
}

export const getCanvas = (state: UIState) => state.layout.canvas;
export const getDefaultSettingsTab = (state: UIState) => state.layout.defaultSettingsTab;
export const getLoadingPageTipIndex = (state: UIState) => state.layout.loadingPageTipIndex;
export const getModal = (state: UIState) => state.layout.modal;
export const getModalOptions = (state: UIState) => state.layout.modalOptions;
export const getSelectedPanel = (state: UIState) => state.layout.selectedPanel;
export const getSelectedPrimaryPanel = (state: UIState) => state.layout.selectedPrimaryPanel;
export const getShowEditor = (state: UIState) => state.layout.showEditor;
export const getShowVideoPanel = (state: UIState) => state.layout.showVideoPanel;
export const getShowCommandPalette = (state: UIState) => state.layout?.showCommandPalette;
export const getTheme = (state: UIState) => state.layout.theme;
export const getViewMode = (state: UIState) => state.layout.viewMode;
export const isInspectorSelected = (state: UIState) =>
  getViewMode(state) === "dev" && getSelectedPanel(state) == "inspector";
