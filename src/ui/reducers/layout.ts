import { sourcesDisplayed } from "devtools/client/debugger/src/reducers/ui";
import { LayoutAction } from "ui/actions/layout";
import { UIState } from "ui/state";
import { LayoutState, ViewMode } from "ui/state/layout";
import { features, prefs } from "ui/utils/prefs";

export const syncInitialLayoutState: LayoutState = {
  consoleFilterDrawerExpanded: prefs.consoleFilterDrawerExpanded as boolean,
  showCommandPalette: false,
  selectedPrimaryPanel: "events",
  viewMode: prefs.defaultMode as ViewMode,
  showVideoPanel: true,
  toolboxLayout: "ide",
  selectedPanel: "console",
  localNags: [],
};

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

    case sourcesDisplayed.type: {
      return { ...state, selectedPrimaryPanel: "explorer" };
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

    case "dismiss_local_nag": {
      return {
        ...state,
        localNags: state.localNags.includes(action.nag)
          ? state.localNags
          : [...state.localNags, action.nag],
      };
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
export const getLocalNags = (state: UIState) => state.layout.localNags;
