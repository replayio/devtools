import { RecordingId } from "@recordreplay/protocol";
import { Action } from "redux";
import { getShowCommandPalette } from "ui/reducers/layout";
import { dismissLocalNag, isLocalNagDismissed, LocalNag } from "ui/setup/prefs";
import {
  Canvas,
  ModalOptionsType,
  ModalType,
  PanelName,
  PrimaryPanelName,
  SettingsTabTitle,
  ViewMode,
} from "ui/state/layout";
import { asyncStore } from "ui/utils/prefs";
import { trackEvent } from "ui/utils/telemetry";
import { UIThunkAction } from ".";

type SetShowCommandPalette = Action<"set_show_command_palette"> & { value: boolean };
type SetCanvas = Action<"set_canvas"> & { canvas: Canvas };
type SetDefaultSettingsTab = Action<"set_default_settings_tab"> & {
  tabTitle: SettingsTabTitle;
};
type SetLoadingPageTipIndexAction = Action<"set_loading_page_tip_index"> & {
  index: number;
};
type SetModalAction = Action<"set_modal"> & {
  modal: ModalType | null;
  options: ModalOptionsType;
};
type SetSelectedPanelAction = Action<"set_selected_panel"> & { panel: PanelName };
type SetSelectedPrimaryPanelAction = Action<"set_selected_primary_panel"> & {
  panel: PrimaryPanelName;
};
type SetShowVideoPanelAction = Action<"set_show_video_panel"> & {
  showVideoPanel: boolean;
};
type SetShowEditorAction = Action<"set_show_editor"> & {
  showEditor: boolean;
};
type UpdateThemeAction = Action<"update_theme"> & { theme: string };
type SetViewMode = Action<"set_view_mode"> & { viewMode: ViewMode };
export type LayoutActions =
  | SetShowCommandPalette
  | SetModalAction
  | SetSelectedPanelAction
  | SetSelectedPrimaryPanelAction
  | SetShowEditorAction
  | SetShowVideoPanelAction
  | SetModalAction
  | SetLoadingPageTipIndexAction
  | SetDefaultSettingsTab
  | SetCanvas
  | UpdateThemeAction
  | SetViewMode;

export function setShowCommandPalette(value: boolean): SetShowCommandPalette {
  return { type: "set_show_command_palette", value };
}
export function hideCommandPalette(): SetShowCommandPalette {
  return setShowCommandPalette(false);
}
export function toggleCommandPalette(): UIThunkAction {
  return ({ dispatch, getState }) => {
    const showCommandPalette = getShowCommandPalette(getState());
    dispatch(setShowCommandPalette(!showCommandPalette));
  };
}

export function setCanvas(canvas: Canvas): SetCanvas {
  return { type: "set_canvas", canvas };
}

export function setDefaultSettingsTab(tabTitle: SettingsTabTitle): SetDefaultSettingsTab {
  return { type: "set_default_settings_tab", tabTitle };
}

export function setLoadingPageTipIndex(index: number): SetLoadingPageTipIndexAction {
  return { type: "set_loading_page_tip_index", index };
}

export function setModal(modalType: ModalType, options: ModalOptionsType = null): SetModalAction {
  return {
    type: "set_modal",
    modal: modalType,
    options,
  };
}

export function hideModal(): SetModalAction {
  return {
    type: "set_modal",
    modal: null,
    options: null,
  };
}

export function setSelectedPanel(panel: PanelName): SetSelectedPanelAction {
  return { type: "set_selected_panel", panel };
}

export function setSelectedPrimaryPanel(panel: PrimaryPanelName): SetSelectedPrimaryPanelAction {
  return { type: "set_selected_primary_panel", panel };
}
export function setShowVideoPanel(showVideoPanel: boolean): SetShowVideoPanelAction {
  return { type: "set_show_video_panel", showVideoPanel };
}

export function setShowEditor(showEditor: boolean): SetShowEditorAction {
  return { type: "set_show_editor", showEditor };
}

export function updateTheme(theme: string): UpdateThemeAction {
  return { type: "update_theme", theme };
}

export function setViewMode(viewMode: ViewMode): UIThunkAction {
  return async ({ dispatch }) => {
    // There's a possible race condition here so it's important to handle the nag logic first.
    // Otherwise, it's possible for the nag to not be properly dismissed.
    if (viewMode === "dev" && !(await isLocalNagDismissed(LocalNag.YANK_TO_SOURCE))) {
      await dismissLocalNag(LocalNag.YANK_TO_SOURCE);
      dispatch(setSelectedPrimaryPanel("explorer"));
    }

    dispatch({ type: "set_view_mode", viewMode });
    trackEvent(viewMode == "dev" ? "visit devtools" : "visit viewer");
  };
}

export function loadReplayLayoutPrefs(recordingId: RecordingId): UIThunkAction {
  return async ({ dispatch }) => {
    const replaySessions = await asyncStore.replaySessions;
    const session = replaySessions[recordingId];

    if (recordingId && session) {
      const { viewMode, showVideoPanel, showEditor, selectedPrimaryPanel } = session;

      dispatch(setViewMode(viewMode));
      dispatch(setShowEditor(showEditor));
      dispatch(setShowVideoPanel(showVideoPanel));
      dispatch(setSelectedPrimaryPanel(selectedPrimaryPanel));
    }
  };
}
