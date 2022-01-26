import { UIState } from "ui/state";
import { LayoutState } from "ui/state/layout";
import { LayoutAction } from "ui/actions/layout";
import { asyncStore } from "../utils/prefs";
import { trackEvent } from "ui/utils/telemetry";
import { Recording } from "ui/types";
import { getRecording } from "ui/hooks/recordings";
import { getRecordingId } from "ui/utils/recording";

const syncInitialLayoutState: LayoutState = {
  showCommandPalette: false,
  selectedPrimaryPanel: "events",
  viewMode: "non-dev",
  showVideoPanel: true,
  showEditor: true,
  selectedPanel: "console",
};

const getDefaultSelectedPrimaryPanel = (session: any, recording?: Recording) => {
  if (session) {
    return session.selectedPrimaryPanel;
  }

  if (!recording) {
    return syncInitialLayoutState.selectedPrimaryPanel;
  }

  return recording.comments.length ? "comments" : syncInitialLayoutState.selectedPrimaryPanel;
};

export async function getInitialLayoutState(): Promise<LayoutState> {
  const recordingId = getRecordingId();

  // If we're in the library, there are no preferences to fetch.
  if (!recordingId) {
    return syncInitialLayoutState;
  }

  let recording;
  try {
    recording = await getRecording(recordingId);
  } catch (e) {
    return syncInitialLayoutState;
  }

  const session = (await asyncStore.replaySessions)[recordingId];

  if (!session) {
    return {
      ...syncInitialLayoutState,
      selectedPrimaryPanel: getDefaultSelectedPrimaryPanel(session, recording),
    };
  }

  const { viewMode, showVideoPanel, showEditor, selectedPanel } = syncInitialLayoutState;
  const initialViewMode = session.viewMode || viewMode;
  trackEvent(initialViewMode == "dev" ? "layout.default_devtools" : "layout.default_viewer");

  return {
    ...syncInitialLayoutState,
    viewMode: initialViewMode,
    selectedPanel: "selectedPanel" in session ? session.selectedPanel : selectedPanel,
    selectedPrimaryPanel: getDefaultSelectedPrimaryPanel(session, recording),
    showVideoPanel: "showVideoPanel" in session ? session.showVideoPanel : showVideoPanel,
    showEditor: "showEditor" in session ? session.showEditor : showEditor,
  };
}

export default function update(state = syncInitialLayoutState, action: LayoutAction): LayoutState {
  switch (action.type) {
    case "set_show_command_palette": {
      return {
        ...state,
        showCommandPalette: action.value,
      };
    }

    case "set_selected_panel": {
      return { ...state, selectedPanel: action.panel };
    }

    case "set_selected_primary_panel": {
      return { ...state, selectedPrimaryPanel: action.panel };
    }

    case "set_view_mode": {
      return { ...state, viewMode: action.viewMode };
    }

    case "set_show_video_panel": {
      return { ...state, showVideoPanel: action.showVideoPanel };
    }

    case "set_show_editor": {
      return { ...state, showEditor: action.showEditor };
    }

    default: {
      return state;
    }
  }
}

export const isInspectorSelected = (state: UIState) =>
  getViewMode(state) === "dev" && getSelectedPanel(state) == "inspector";
export const getShowCommandPalette = (state: UIState) => state.layout.showCommandPalette;
export const getSelectedPrimaryPanel = (state: UIState) => state.layout.selectedPrimaryPanel;
export const getSelectedPanel = (state: UIState) => state.layout.selectedPanel;
export const getViewMode = (state: UIState) => state.layout.viewMode;
export const getShowVideoPanel = (state: UIState) => state.layout.showVideoPanel;
export const getShowEditor = (state: UIState) => state.layout.showEditor;
