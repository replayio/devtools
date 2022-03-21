import { RecordingId } from "@recordreplay/protocol";
import { Action } from "redux";
import {
  getSelectedPanel,
  getSelectedPrimaryPanel,
  getShowCommandPalette,
} from "ui/reducers/layout";
import { dismissLocalNag, isLocalNagDismissed, LocalNag } from "ui/setup/prefs";
import {
  ViewMode,
  PrimaryPanelName,
  SecondaryPanelName,
  VIEWER_PANELS,
  ToolboxLayout,
  TOGGLE_DELAY,
} from "ui/state/layout";
import { asyncStore } from "ui/utils/prefs";
import { trackEvent } from "ui/utils/telemetry";
import { UIThunkAction } from ".";

type SetConsoleFilterDrawerExpandedAction = Action<"set_console_filter_drawer_expanded"> & {
  expanded: boolean;
};
type SetSelectedPrimaryPanelAction = Action<"set_selected_primary_panel"> & {
  panel: PrimaryPanelName;
};
type SetShowCommandPaletteAction = Action<"set_show_command_palette"> & { value: boolean };

type SetToolboxLayoutAction = Action<"set_toolbox_layout"> & {
  layout: ToolboxLayout;
};
type SetShowVideoPanelAction = Action<"set_show_video_panel"> & {
  showVideoPanel: boolean;
};
type SetViewModeAction = Action<"set_view_mode"> & { viewMode: ViewMode };
export type SetSelectedPanelAction = Action<"set_selected_panel"> & { panel: SecondaryPanelName };

type SetViewToggleModeAction = Action<"set_view_toggle_mode"> & { viewToggleMode: ViewMode };

export type LayoutAction =
  | SetConsoleFilterDrawerExpandedAction
  | SetSelectedPanelAction
  | SetSelectedPrimaryPanelAction
  | SetShowCommandPaletteAction
  | SetToolboxLayoutAction
  | SetShowVideoPanelAction
  | SetViewModeAction
  | SetViewToggleModeAction;

export function setShowCommandPalette(value: boolean): SetShowCommandPaletteAction {
  return { type: "set_show_command_palette", value };
}
export function hideCommandPalette(): SetShowCommandPaletteAction {
  return setShowCommandPalette(false);
}
export function toggleCommandPalette(): UIThunkAction {
  return ({ dispatch, getState }) => {
    const showCommandPalette = getShowCommandPalette(getState());
    dispatch(setShowCommandPalette(!showCommandPalette));
  };
}
export function setViewMode(viewMode: ViewMode): UIThunkAction {
  return async ({ dispatch, getState }) => {
    // There's a possible race condition here so it's important to handle the nag logic first.
    // Otherwise, it's possible for the nag to not be properly dismissed.
    if (viewMode === "dev" && !(await isLocalNagDismissed(LocalNag.YANK_TO_SOURCE))) {
      await dismissLocalNag(LocalNag.YANK_TO_SOURCE);
      dispatch(setSelectedPrimaryPanel("explorer"));
    }

    //Update viewToggleMode to start toggle animation
    dispatch(setViewToggleMode(viewMode));

    // Delay updating the viewMode in redux so that the toggle can fully animate
    // before re-rendering all of devtools in the new viewMode.
    const delayPromise = new Promise<void>(resolve => {
      setTimeout(() => resolve(), TOGGLE_DELAY);
    });

    await delayPromise;
    // If switching to non-dev mode, we check the selectedPrimaryPanel and update to comments
    // if selectedPrimaryPanel is one that should only be visible in dev mode.
    const selectedPrimaryPanel = getSelectedPrimaryPanel(getState());
    if (viewMode === "non-dev" && !VIEWER_PANELS.includes(selectedPrimaryPanel as any)) {
      dispatch(setSelectedPrimaryPanel("comments"));
    }

    dispatch({ type: "set_view_mode", viewMode });
    trackEvent(viewMode == "dev" ? "layout.devtools" : "layout.viewer");
  };
}
export function setShowVideoPanel(showVideoPanel: boolean): SetShowVideoPanelAction {
  trackEvent("toolbox.secondary.video_toggle");

  return { type: "set_show_video_panel", showVideoPanel };
}

export function setToolboxLayout(layout: ToolboxLayout): UIThunkAction {
  return ({ dispatch, getState }) => {
    const selectedPanel = getSelectedPanel(getState());

    // If the debugger's being unset from the toolbox and it happens to be selected,
    // we should deselect it and select the console instead.
    if (layout == "ide" && selectedPanel === "debugger") {
      dispatch(setSelectedPanel("console"));
    }

    dispatch({ type: "set_toolbox_layout", layout });
  };
}
export function setViewToggleMode(viewToggleMode: ViewMode): SetViewToggleModeAction {
  return { type: "set_view_toggle_mode", viewToggleMode };
}
export function setSelectedPanel(panel: SecondaryPanelName): SetSelectedPanelAction {
  return { type: "set_selected_panel", panel };
}

export function setSelectedPrimaryPanel(panel: PrimaryPanelName): SetSelectedPrimaryPanelAction {
  return { type: "set_selected_primary_panel", panel };
}

export function setConsoleFilterDrawerExpanded(
  expanded: boolean
): SetConsoleFilterDrawerExpandedAction {
  return { type: "set_console_filter_drawer_expanded", expanded };
}

export function loadReplayPrefs(recordingId: RecordingId): UIThunkAction {
  return async ({ dispatch }) => {
    const replaySessions = await asyncStore.replaySessions;
    const session = replaySessions[recordingId];

    if (recordingId && session) {
      const { viewMode, showVideoPanel, toolboxLayout, selectedPrimaryPanel } = session;

      dispatch(setViewMode(viewMode));
      dispatch(setToolboxLayout(toolboxLayout));
      dispatch(setShowVideoPanel(showVideoPanel));
      dispatch(setSelectedPrimaryPanel(selectedPrimaryPanel));
    }
  };
}
