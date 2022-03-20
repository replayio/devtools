import { UIState } from "ui/state";
import { LayoutState } from "ui/state/layout";
import { LayoutAction } from "ui/actions/layout";
import { asyncStore } from "../utils/prefs";
import { trackEvent } from "ui/utils/telemetry";
import { Recording } from "ui/types";
import { getRecording } from "ui/hooks/recordings";
import { getRecordingId } from "ui/utils/recording";

const syncInitialLayoutState: LayoutState = {
  consoleFilterDrawerExpanded: true,
  showCommandPalette: false,
  selectedPrimaryPanel: "events",
  viewMode: "non-dev",
  showVideoPanel: true,
  toolboxLayout: "ide",
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

  const { viewMode, showVideoPanel, toolboxLayout, selectedPanel, consoleFilterDrawerExpanded } =
    syncInitialLayoutState;
  const initialViewMode = session.viewMode || viewMode;
  trackEvent(initialViewMode == "dev" ? "layout.default_devtools" : "layout.default_viewer");

  return {
    ...syncInitialLayoutState,
    consoleFilterDrawerExpanded:
      "consoleFilterDrawerExpanded" in session
        ? session.consoleFilterDrawerExpanded
        : consoleFilterDrawerExpanded,
    viewMode: initialViewMode,
    selectedPanel: "selectedPanel" in session ? session.selectedPanel : selectedPanel,
    selectedPrimaryPanel: getDefaultSelectedPrimaryPanel(session, recording),
    showVideoPanel: "showVideoPanel" in session ? session.showVideoPanel : showVideoPanel,
    toolboxLayout: "toolboxLayout" in session ? session.toolboxLayout : toolboxLayout,
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

    case "set_toolbox_layout": {
      return { ...state, toolboxLayout: action.layout };
    }

    case "set_console_filter_drawer_expanded": {
      return { ...state, consoleFilterDrawerExpanded: action.expanded };
    }

    default: {
      return state;
    }
  }
}

export const isInspectorSelected = (state: UIState) =>
  getViewMode(state) === "dev" && getSelectedPanel(state) == "inspector";
export const getConsoleFilterDrawerExpanded = (state: UIState) =>
  state.layout.consoleFilterDrawerExpanded;
export const getShowCommandPalette = (state: UIState) => state.layout.showCommandPalette;
export const getSelectedPrimaryPanel = (state: UIState) => state.layout.selectedPrimaryPanel;
export const getSelectedPanel = (state: UIState) => state.layout.selectedPanel;
export const getViewMode = (state: UIState) => state.layout.viewMode;
export const getShowVideoPanel = (state: UIState) => state.layout.showVideoPanel;
export const getToolboxLayout = (state: UIState) => state.layout.toolboxLayout;
