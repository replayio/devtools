import { Action } from "redux";
import { UIStore, UIThunkAction } from ".";
import {
  RecordingId,
  SessionId,
  unprocessedRegions,
  PointDescription,
  Location,
  MouseEvent,
  loadedRegions,
  TimeStampedPoint,
  TimeRange,
} from "@recordreplay/protocol";
import { ThreadFront } from "protocol/thread";
import * as selectors from "ui/reducers/app";
import {
  PanelName,
  PrimaryPanelName,
  ViewMode,
  Event,
  ModalType,
  UploadInfo,
  Canvas,
  WorkspaceId,
  SettingsTabTitle,
} from "ui/state/app";
import { RecordingTarget } from "protocol/thread/thread";
import { Workspace } from "ui/types";

export type SetupAppAction = Action<"setup_app"> & { recordingId: RecordingId };
export type SetRecordingDurationAction = Action<"set_recording_duration"> & { duration: number };
export type LoadingAction = Action<"loading"> & { loading: number };
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
  options: { recordingId: string } | null;
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
  events: MouseEvent[];
  eventType: Event;
};
export type SetViewMode = Action<"set_view_mode"> & { viewMode: ViewMode };
export type SetNarrowMode = Action<"set_narrow_mode"> & { narrowMode: boolean };
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

export type AppActions =
  | SetupAppAction
  | SetRecordingDurationAction
  | LoadingAction
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
  | SetNarrowMode
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
  | SetAwaitingSourcemapsAction;

const NARROW_MODE_WIDTH = 800;

/*
 * Backwards-compat helpers to get time range from either
 * a regular TimeRange or a TimeStampedPointRange.
 */
function getTime(arg: number | TimeStampedPoint): number {
  return typeof arg === "number" ? arg : arg.time;
}
function getTimeRange(arg: any): TimeRange {
  return {
    begin: getTime(arg.begin),
    end: getTime(arg.end),
  };
}

export function setupApp(recordingId: RecordingId, store: UIStore) {
  store.dispatch({ type: "setup_app", recordingId });

  ThreadFront.waitForSession().then(sessionId =>
    store.dispatch({ type: "set_session_id", sessionId })
  );

  ThreadFront.ensureProcessed("basic", undefined, regions =>
    store.dispatch(onUnprocessedRegions(regions))
  ).then(() => {
    store.dispatch(setLoading(100));
  });

  ThreadFront.ensureProcessed("executionIndexed").then(() => {
    console.log("indexed");
    store.dispatch(setIndexing(100));
  });

  ThreadFront.listenForLoadChanges((parameters: any) => {
    const loadedRegions = {
      loading: parameters.loading.map((region: any) => getTimeRange(region)),
      loaded: parameters.loaded.map((region: any) => getTimeRange(region)),
    };
    store.dispatch({ type: "set_loaded_regions", parameters: loadedRegions });
  });
}

function onUnprocessedRegions({ level, regions }: unprocessedRegions): UIThunkAction {
  return ({ dispatch, getState }) => {
    let endPoint = Math.max(...regions.map(r => getTimeRange(r).end), 0);
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
      (sum, region) => sum + (getTimeRange(region).end - getTimeRange(region).begin),
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

function setRecordingDuration(duration: number): SetRecordingDurationAction {
  return { type: "set_recording_duration", duration };
}

function setLoading(loading: number): LoadingAction {
  return { type: "loading", loading };
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

export function setModal(
  modalType: ModalType,
  options: { recordingId: string } | null = null
): SetModalAction {
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

export function setEventsForType(events: MouseEvent[], eventType: Event): SetEventsForType {
  return {
    type: "set_events",
    eventType,
    events,
  };
}

export function setViewMode(viewMode: ViewMode): SetViewMode {
  return { type: "set_view_mode", viewMode };
}

function setNarrowMode(narrowMode: boolean): SetNarrowMode {
  return { type: "set_narrow_mode", narrowMode };
}

export function updateNarrowMode(viewportWidth: number): UIThunkAction {
  return ({ dispatch, getState }) => {
    const narrowMode = selectors.getNarrowMode(getState());
    const newNarrowMode = viewportWidth <= NARROW_MODE_WIDTH;

    if (newNarrowMode != narrowMode) {
      dispatch(setNarrowMode(newNarrowMode));
    }
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
