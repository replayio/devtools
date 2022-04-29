import { Action } from "redux";
import { UIStore, UIThunkAction } from ".";
import {
  SessionId,
  unprocessedRegions,
  PointDescription,
  Location,
  MouseEvent,
  KeyboardEvent,
  TimeStampedPointRange,
} from "@recordreplay/protocol";
import { ThreadFront, RecordingTarget } from "protocol/thread/thread";
import * as selectors from "ui/reducers/app";
import {
  ModalType,
  ModalOptionsType,
  UploadInfo,
  Canvas,
  WorkspaceId,
  SettingsTabTitle,
  EventKind,
  ReplayEvent,
  ReplayNavigationEvent,
  AppTheme,
  AppMode,
  LoadedRegions,
} from "ui/state/app";
import { Workspace } from "ui/types";
import { client, sendMessage } from "protocol/socket";
import groupBy from "lodash/groupBy";
import { compareBigInt } from "ui/utils/helpers";
import { isTest } from "ui/utils/environment";
import tokenManager from "ui/utils/tokenManager";
import {
  hideCommandPalette,
  setSelectedPanel,
  setSelectedPrimaryPanel,
  setShowVideoPanel,
  setToolboxLayout,
  setViewMode,
} from "./layout";
import { CommandKey } from "ui/components/CommandPalette/CommandPalette";
import { openQuickOpen } from "devtools/client/debugger/src/actions/quick-open";
import { PanelName } from "ui/state/layout";
import { getRecordingId } from "ui/utils/recording";
import { prefs } from "devtools/client/debugger/src/utils/prefs";
import { shallowEqual } from "devtools/client/debugger/src/utils/resource/compare";
import { getShowVideoPanel } from "ui/reducers/layout";
import { toggleFocusMode } from "./timeline";
import { getTheme } from "ui/reducers/app";

export type SetRecordingDurationAction = Action<"set_recording_duration"> & { duration: number };
export type LoadingAction = Action<"loading"> & { loading: number };
export type SetDisplayedLoadingProgressAction = Action<"set_displayed_loading_progress"> & {
  progress: number | null;
};
export type SetLoadingFinishedAction = Action<"set_loading_finished"> & { finished: boolean };
export type SetSessionIdAction = Action<"set_session_id"> & { sessionId: SessionId };
export type UpdateThemeAction = Action<"update_theme"> & { theme: AppTheme };
export type SetInitializedPanelsAction = Action<"set_initialized_panels"> & { panel: PanelName };
export type SetUploadingAction = Action<"set_uploading"> & { uploading: UploadInfo | null };
export type SetAwaitingSourcemapsAction = Action<"set_awaiting_sourcemaps"> & {
  awaitingSourcemaps: boolean;
};
export type SetModalAction = Action<"set_modal"> & {
  modal: ModalType | null;
  options: ModalOptionsType;
};

export type SetAnalysisPointsAction = Action<"set_analysis_points"> & {
  analysisPoints: PointDescription[];
  location: Location;
  condition: string;
};
export type SetAnalysisErrorAction = Action<"set_analysis_error"> & {
  location: Location;
  condition: string;
  errorKey?: number;
};
export type SetEventsForType = Action<"set_events"> & {
  events: (MouseEvent | KeyboardEvent | ReplayNavigationEvent)[];
  eventType: EventKind;
};
export type SetHoveredLineNumberLocation = Action<"set_hovered_line_number_location"> & {
  location: Location | null;
};
export type SetIsNodePickerActive = Action<"set_is_node_picker_active"> & { active: boolean };
export type SetIsNodePickerInitializing = Action<"set_is_node_picker_initializing"> & {
  initializing: boolean;
};
export type SetCanvas = Action<"set_canvas"> & { canvas: Canvas };
export type SetVideoUrl = Action<"set_video_url"> & { videoUrl: string };
export type SetWorkspaceId = Action<"set_workspace_id"> & { workspaceId: WorkspaceId | null };
export type SetDefaultSettingsTab = Action<"set_default_settings_tab"> & {
  tabTitle: SettingsTabTitle;
};
export type SetRecordingTargetAction = Action<"set_recording_target"> & {
  recordingTarget: RecordingTarget;
};
export type SetRecordingWorkspaceAction = Action<"set_recording_workspace"> & {
  workspace: Workspace;
};
export type SetLoadedRegions = Action<"set_loaded_regions"> & {
  parameters: LoadedRegions;
};
export type SetMouseTargetsLoading = Action<"mouse_targets_loading"> & {
  loading: boolean;
};
export type SetAppModeAction = Action<"set_app_mode"> & { mode: AppMode };

export type AppActions =
  | SetRecordingDurationAction
  | LoadingAction
  | SetDisplayedLoadingProgressAction
  | SetLoadingFinishedAction
  | SetSessionIdAction
  | UpdateThemeAction
  | SetInitializedPanelsAction
  | SetUploadingAction
  | SetModalAction
  | SetAnalysisPointsAction
  | SetAnalysisErrorAction
  | SetEventsForType
  | SetHoveredLineNumberLocation
  | SetIsNodePickerActive
  | SetIsNodePickerInitializing
  | SetCanvas
  | SetMouseTargetsLoading
  | SetVideoUrl
  | SetWorkspaceId
  | SetDefaultSettingsTab
  | SetRecordingTargetAction
  | SetRecordingWorkspaceAction
  | SetLoadedRegions
  | SetAwaitingSourcemapsAction
  | SetAppModeAction;

export function setupApp(store: UIStore) {
  if (!isTest()) {
    tokenManager.addListener(({ token }) => {
      if (token) {
        sendMessage("Authentication.setAccessToken", { accessToken: token });
      }
    });
    tokenManager.getToken();
  }

  ThreadFront.waitForSession().then(sessionId => {
    store.dispatch({ type: "set_session_id", sessionId });

    client.Session.findKeyboardEvents({}, sessionId);
    client.Session.addKeyboardEventsListener(({ events }) => onKeyboardEvents(events, store));

    client.Session.findNavigationEvents({}, sessionId);
    client.Session.addNavigationEventsListener(({ events }) =>
      onNavigationEvents(events as ReplayNavigationEvent[], store)
    );
  });

  ThreadFront.ensureProcessed("basic", undefined, regions =>
    store.dispatch(onUnprocessedRegions(regions))
  ).then(() => {
    store.dispatch(setLoading(100));
  });

  ThreadFront.listenForLoadChanges(parameters => {
    store.dispatch({ type: "set_loaded_regions", parameters });
  });
}

export function onUnprocessedRegions({ level, regions }: unprocessedRegions): UIThunkAction {
  return (dispatch, getState) => {
    if (level === "executionIndexed") {
      return;
    }

    let endPoint = Math.max(...regions.map(r => r.end.time), 0);
    if (endPoint == 0) {
      return;
    }
    const state = getState();
    if (endPoint > selectors.getRecordingDuration(state)) {
      dispatch(setRecordingDuration(endPoint));
    } else {
      endPoint = selectors.getRecordingDuration(state);
    }

    const unprocessedProgress = regions.reduce(
      (sum, region) => sum + (region.end.time - region.begin.time),
      0
    );
    const processedProgress = endPoint - unprocessedProgress;
    const percentProgress = (processedProgress / endPoint) * 100;

    dispatch(setLoading(percentProgress));
  };
}

function onKeyboardEvents(events: KeyboardEvent[], store: UIStore) {
  const groupedEvents = groupBy(events, event => event.kind);

  Object.entries(groupedEvents).map(([eventKind, kindEvents]) => {
    const keyboardEvents = [
      ...selectors.getEventsForType(store.getState(), eventKind),
      ...kindEvents,
    ];
    keyboardEvents.sort((a: ReplayEvent, b: ReplayEvent) =>
      compareBigInt(BigInt(a.point), BigInt(b.point))
    );

    store.dispatch(setEventsForType(keyboardEvents, eventKind));
  });
}

function onNavigationEvents(events: ReplayNavigationEvent[], store: UIStore) {
  const currentNavEvents: ReplayNavigationEvent[] = events.map(e => ({ ...e, kind: "navigation" }));
  const newNavEvents = [
    ...selectors.getEventsForType(store.getState(), "navigation"),
    ...currentNavEvents,
  ];
  newNavEvents.sort((a, b) => compareBigInt(BigInt(a.point), BigInt(b.point)));

  store.dispatch(setEventsForType(newNavEvents, "navigation"));
}

function setRecordingDuration(duration: number): SetRecordingDurationAction {
  return { type: "set_recording_duration", duration };
}

function setLoading(loading: number): LoadingAction {
  return { type: "loading", loading };
}

export function setDisplayedLoadingProgress(
  progress: number | null
): SetDisplayedLoadingProgressAction {
  return { type: "set_displayed_loading_progress", progress };
}

export function setLoadingFinished(finished: boolean): SetLoadingFinishedAction {
  return { type: "set_loading_finished", finished };
}

export function updateTheme(theme: AppTheme): UpdateThemeAction {
  return { type: "update_theme", theme };
}

export function toggleTheme(): UIThunkAction {
  return (dispatch, getState) => {
    const theme = getTheme(getState());
    const newTheme = theme == "dark" ? "light" : "dark";
    dispatch(updateTheme(newTheme));
  };
}

export function setInitializedPanels(panel: PanelName): SetInitializedPanelsAction {
  return { type: "set_initialized_panels", panel };
}

export function setUploading(uploading: UploadInfo | null): SetUploadingAction {
  return { type: "set_uploading", uploading };
}

export function setAwaitingSourcemaps(awaitingSourcemaps: boolean): SetAwaitingSourcemapsAction {
  return { type: "set_awaiting_sourcemaps", awaitingSourcemaps };
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

export function setAnalysisPoints(
  points: PointDescription[],
  location: Location,
  condition = ""
): SetAnalysisPointsAction {
  return {
    type: "set_analysis_points",
    analysisPoints: points,
    location,
    condition,
  };
}

export function setAnalysisError(
  location: Location,
  condition = "",
  errorKey?: number
): SetAnalysisErrorAction {
  return {
    type: "set_analysis_error",
    location,
    condition,
    errorKey,
  };
}

export function setEventsForType(events: ReplayEvent[], eventType: EventKind): SetEventsForType {
  return {
    type: "set_events",
    eventType,
    events,
  };
}

export function setHoveredLineNumberLocation(
  location: Location | null
): SetHoveredLineNumberLocation {
  return { type: "set_hovered_line_number_location", location };
}

export function setIsNodePickerActive(active: boolean): SetIsNodePickerActive {
  return { type: "set_is_node_picker_active", active };
}

export function setIsNodePickerInitializing(initializing: boolean): SetIsNodePickerInitializing {
  return { type: "set_is_node_picker_initializing", initializing };
}

export function setVideoUrl(videoUrl: string): SetVideoUrl {
  return { type: "set_video_url", videoUrl };
}

export function setCanvasAction(canvas: Canvas): SetCanvas {
  return { type: "set_canvas", canvas };
}

export function setCanvas(canvas: Canvas): UIThunkAction {
  return (dispatch, getState) => {
    const { canvas: existingCanvas } = getState().app;

    // Skip dispatching if the new canvas value is identical to what's in the store.
    // This improves perf slightly, especially since this was dispatching frequently.
    if (!shallowEqual(existingCanvas, canvas)) {
      dispatch(setCanvasAction(canvas));
    }
  };
}

export function setWorkspaceId(workspaceId: WorkspaceId | null): SetWorkspaceId {
  return { type: "set_workspace_id", workspaceId };
}

export function setDefaultSettingsTab(tabTitle: SettingsTabTitle): SetDefaultSettingsTab {
  return { type: "set_default_settings_tab", tabTitle };
}

export function setRecordingTarget(recordingTarget: RecordingTarget): SetRecordingTargetAction {
  return { type: "set_recording_target", recordingTarget };
}

export function setRecordingWorkspace(workspace: Workspace): SetRecordingWorkspaceAction {
  return { type: "set_recording_workspace", workspace };
}

export function setMouseTargetsLoading(loading: boolean): SetMouseTargetsLoading {
  return { type: "mouse_targets_loading", loading };
}

export function loadMouseTargets(): UIThunkAction {
  return async dispatch => {
    dispatch(setMouseTargetsLoading(true));
    const resp = await ThreadFront.loadMouseTargets();
    dispatch(setMouseTargetsLoading(false));
    if (resp) {
      dispatch(setIsNodePickerActive(true));
    }
  };
}

export function executeCommand(key: CommandKey): UIThunkAction {
  return (dispatch, getState) => {
    const recordingId = getRecordingId();

    if (key === "open_console") {
      dispatch(setViewMode("dev"));
      dispatch(setSelectedPanel("console"));
      window.jsterm?.editor.focus();
    } else if (key === "open_devtools") {
      dispatch(setViewMode("dev"));
    } else if (key === "open_elements") {
      dispatch(setViewMode("dev"));
      dispatch(setSelectedPanel("inspector"));
      gToolbox.selectTool("inspector");
    } else if (key === "open_file_search") {
      dispatch(setViewMode("dev"));
      dispatch(openQuickOpen());
    } else if (key === "open_full_text_search") {
      dispatch(setViewMode("dev"));
      dispatch(setSelectedPrimaryPanel("search"));
    } else if (key === "open_function_search") {
      dispatch(setViewMode("dev"));
      dispatch(openQuickOpen("@", true));
    } else if (key === "open_network_monitor") {
      dispatch(setViewMode("dev"));
      dispatch(setSelectedPanel("network"));
    } else if (key === "open_print_statements") {
      dispatch(setViewMode("dev"));
      dispatch(setSelectedPrimaryPanel("debugger"));
    } else if (key === "open_react_devtools") {
      dispatch(setViewMode("dev"));
      dispatch(setSelectedPanel("react-components"));
    } else if (key === "open_sources") {
      dispatch(setViewMode("dev"));
      dispatch(setSelectedPrimaryPanel("explorer"));
      // Someday we'll fix circular dependencies. Today is not that day.
      const { expandSourcesPane } = require("devtools/client/debugger/src/actions/ui");
      dispatch(expandSourcesPane());
    } else if (key === "open_outline") {
      dispatch(setViewMode("dev"));
      dispatch(setSelectedPrimaryPanel("explorer"));
      prefs.outlineExpanded = true;
    } else if (key === "open_viewer") {
      dispatch(setViewMode("non-dev"));
    } else if (key === "show_comments") {
      dispatch(setSelectedPrimaryPanel("comments"));
    } else if (key === "show_console_filters") {
      dispatch(setViewMode("dev"));
      dispatch(setSelectedPanel("console"));
    } else if (key === "show_events" || key === "show_replay_info") {
      dispatch(setSelectedPrimaryPanel("events"));
    } else if (key === "show_privacy") {
      dispatch(setModal("privacy"));
    } else if (key === "show_sharing") {
      dispatch(setModal("sharing", { recordingId }));
    } else if (key === "toggle_edit_focus") {
      dispatch(toggleFocusMode());
    } else if (key === "toggle_video") {
      const showVideoPanel = getShowVideoPanel(getState());
      dispatch(setShowVideoPanel(!showVideoPanel));
    } else if (key === "toggle_dark_mode") {
      dispatch(toggleTheme());
    } else if (key === "pin_to_bottom") {
      dispatch(setToolboxLayout("bottom"));
    } else if (key === "pin_to_left") {
      dispatch(setToolboxLayout("left"));
    } else if (key === "pin_to_bottom_right") {
      dispatch(setToolboxLayout("ide"));
    }

    dispatch(hideCommandPalette());
  };
}

export function setAppMode(mode: AppMode): SetAppModeAction {
  return { type: "set_app_mode", mode };
}
