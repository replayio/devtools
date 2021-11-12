import { Action } from "redux";
import { UIStore, UIThunkAction } from ".";
import {
  SessionId,
  unprocessedRegions,
  PointDescription,
  Location,
  MouseEvent,
  loadedRegions,
  KeyboardEvent,
  NavigationEvent,
  RecordingId,
} from "@recordreplay/protocol";
import { ThreadFront, RecordingTarget } from "protocol/thread/thread";
import * as selectors from "ui/reducers/app";
import {
  PanelName,
  PrimaryPanelName,
  ViewMode,
  ModalType,
  ModalOptionsType,
  UploadInfo,
  Canvas,
  WorkspaceId,
  SettingsTabTitle,
  EventKind,
  ReplayEvent,
} from "ui/state/app";
import { Workspace } from "ui/types";
import { trackEvent } from "ui/utils/telemetry";
import { client, sendMessage } from "protocol/socket";
import groupBy from "lodash/groupBy";
import { compareBigInt } from "ui/utils/helpers";
import { isTest } from "ui/utils/environment";
import tokenManager from "ui/utils/tokenManager";
import { asyncStore } from "ui/utils/prefs";
import { trackTiming } from "ui/utils/telemetry";

export type SetRecordingDurationAction = Action<"set_recording_duration"> & { duration: number };
export type LoadingAction = Action<"loading"> & { loading: number };
export type SetDisplayedLoadingProgressAction = Action<"set_displayed_loading_progress"> & {
  progress: number | null;
};
export type SetLoadingFinishedAction = Action<"set_loading_finished"> & { finished: boolean };
export type IndexingAction = Action<"indexing"> & { indexing: number };
export type SetSessionIdAction = Action<"set_session_id"> & { sessionId: SessionId };
export type UpdateThemeAction = Action<"update_theme"> & { theme: string };
export type SetSplitConsoleAction = Action<"set_split_console"> & { splitConsole: boolean };
export type SetSelectedPanelAction = Action<"set_selected_panel"> & { panel: PanelName };
export type SetSelectedPrimaryPanelAction = Action<"set_selected_primary_panel"> & {
  panel: PrimaryPanelName;
};
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
};
export type SetEventsForType = Action<"set_events"> & {
  events: (MouseEvent | KeyboardEvent | NavigationEvent)[];
  eventType: EventKind;
};
export type SetViewMode = Action<"set_view_mode"> & { viewMode: ViewMode };
export type SetHoveredLineNumberLocation = Action<"set_hovered_line_number_location"> & {
  location: Location | null;
};
export type SetIsNodePickerActive = Action<"set_is_node_picker_active"> & { active: boolean };
export type SetCanvas = Action<"set_canvas"> & { canvas: Canvas };
export type SetVideoUrl = Action<"set_video_url"> & { videoUrl: string };
export type SetVideoNode = Action<"set_video_node"> & { videoNode: HTMLVideoElement | null };
export type SetWorkspaceId = Action<"set_workspace_id"> & { workspaceId: WorkspaceId | null };
export type SetDefaultSettingsTab = Action<"set_default_settings_tab"> & {
  tabTitle: SettingsTabTitle;
};
export type SetRecordingTargetAction = Action<"set_recording_target"> & {
  recordingTarget: RecordingTarget;
};
export type SetFontLoading = Action<"set_material_icons_loaded"> & {
  fontLoading: boolean;
};
export type SetRecordingWorkspaceAction = Action<"set_recording_workspace"> & {
  workspace: Workspace;
};
export type SetLoadedRegions = Action<"set_loaded_regions"> & {
  parameters: loadedRegions;
};
export type SetShowVideoPanelAction = Action<"set_show_video_panel"> & {
  showVideoPanel: boolean;
};
export type SetShowEditorAction = Action<"set_show_editor"> & {
  showEditor: boolean;
};
export type setLoadingPageTipIndexAction = Action<"set_loading_page_tip_index"> & {
  index: number;
};

export type AppActions =
  | SetRecordingDurationAction
  | LoadingAction
  | SetDisplayedLoadingProgressAction
  | SetLoadingFinishedAction
  | IndexingAction
  | SetSessionIdAction
  | UpdateThemeAction
  | SetSplitConsoleAction
  | SetSelectedPanelAction
  | SetSelectedPrimaryPanelAction
  | SetInitializedPanelsAction
  | SetUploadingAction
  | SetModalAction
  | SetAnalysisPointsAction
  | SetAnalysisErrorAction
  | SetEventsForType
  | SetViewMode
  | SetHoveredLineNumberLocation
  | SetIsNodePickerActive
  | SetCanvas
  | SetVideoUrl
  | SetVideoNode
  | SetWorkspaceId
  | SetDefaultSettingsTab
  | SetRecordingTargetAction
  | SetFontLoading
  | SetRecordingWorkspaceAction
  | SetLoadedRegions
  | SetShowVideoPanelAction
  | SetShowEditorAction
  | SetAwaitingSourcemapsAction
  | setLoadingPageTipIndexAction;

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
    client.Session.addNavigationEventsListener(({ events }) => onNavigationEvents(events, store));
  });

  ThreadFront.ensureProcessed("basic", undefined, regions =>
    store.dispatch(onUnprocessedRegions(regions))
  ).then(() => {
    store.dispatch(setLoading(100));
  });

  ThreadFront.ensureProcessed("executionIndexed").then(() => {
    console.log("indexed");
    store.dispatch(setIndexing(100));
  });

  ThreadFront.listenForLoadChanges(parameters => {
    store.dispatch({ type: "set_loaded_regions", parameters });
  });
}

function onUnprocessedRegions({ level, regions }: unprocessedRegions): UIThunkAction {
  return ({ dispatch, getState }) => {
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

    if (level === "basic") {
      dispatch(setLoading(percentProgress));
    } else {
      dispatch(setIndexing(percentProgress));
    }
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

function onNavigationEvents(events: NavigationEvent[], store: UIStore) {
  const navEvents = [
    ...selectors.getEventsForType(store.getState(), "navigation"),
    ...events.map(e => ({ ...e, kind: "navigation" })),
  ];
  navEvents.sort((a: ReplayEvent, b: ReplayEvent) =>
    compareBigInt(BigInt(a.point), BigInt(b.point))
  );

  store.dispatch(setEventsForType(navEvents, "navigation"));
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
  if (finished) {
    trackTiming("kpi-time-to-view-replay");
  }
  return { type: "set_loading_finished", finished };
}

function setIndexing(indexing: number): IndexingAction {
  return { type: "indexing", indexing };
}

export function updateTheme(theme: string): UpdateThemeAction {
  return { type: "update_theme", theme };
}

export function setSplitConsole(open: boolean): SetSplitConsoleAction {
  return { type: "set_split_console", splitConsole: open };
}

export function setSelectedPanel(panel: PanelName): SetSelectedPanelAction {
  return { type: "set_selected_panel", panel };
}

export function setSelectedPrimaryPanel(panel: PrimaryPanelName): SetSelectedPrimaryPanelAction {
  return { type: "set_selected_primary_panel", panel };
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

export function setAnalysisError(location: Location, condition = ""): SetAnalysisErrorAction {
  return {
    type: "set_analysis_error",
    location,
    condition,
  };
}

export function setEventsForType(
  events: (MouseEvent | KeyboardEvent | NavigationEvent)[],
  eventType: EventKind
): SetEventsForType {
  return {
    type: "set_events",
    eventType,
    events,
  };
}

export function setViewMode(viewMode: ViewMode): SetViewMode {
  trackEvent(viewMode == "dev" ? "visit devtools" : "visit viewer");
  return { type: "set_view_mode", viewMode };
}

export function setHoveredLineNumberLocation(
  location: Location | null
): SetHoveredLineNumberLocation {
  return { type: "set_hovered_line_number_location", location };
}

export function setIsNodePickerActive(active: boolean): SetIsNodePickerActive {
  return { type: "set_is_node_picker_active", active };
}

export function setVideoUrl(videoUrl: string): SetVideoUrl {
  return { type: "set_video_url", videoUrl };
}

export function setVideoNode(videoNode: HTMLVideoElement | null): SetVideoNode {
  return { type: "set_video_node", videoNode };
}

export function setCanvas(canvas: Canvas): SetCanvas {
  return { type: "set_canvas", canvas };
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

export function setFontLoading(value: boolean): SetFontLoading {
  return { type: "set_material_icons_loaded", fontLoading: value };
}

export function setRecordingWorkspace(workspace: Workspace): SetRecordingWorkspaceAction {
  return { type: "set_recording_workspace", workspace };
}

export function setShowVideoPanel(showVideoPanel: boolean): SetShowVideoPanelAction {
  return { type: "set_show_video_panel", showVideoPanel };
}

export function setShowEditor(showEditor: boolean): SetShowEditorAction {
  return { type: "set_show_editor", showEditor };
}

export function loadReplayPrefs(recordingId: RecordingId): UIThunkAction {
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

export function setLoadingPageTipIndex(index: number): setLoadingPageTipIndexAction {
  return { type: "set_loading_page_tip_index", index };
}
