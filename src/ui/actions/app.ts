import { Action } from "redux";
import { UIStore, UIThunkAction } from ".";
import {
  RecordingId,
  SessionId,
  unprocessedRegions,
  PointDescription,
  Location,
  MouseEvent,
} from "@recordreplay/protocol";
import { ThreadFront } from "protocol/thread";
import { selectors } from "ui/reducers";
import {
  PanelName,
  PrimaryPanelName,
  ViewMode,
  Event,
  PendingComment,
  ModalType,
  UploadInfo,
  Canvas,
} from "ui/state/app";

const { PointHandlers } = require("protocol/logpoint");

export type SetupAppAction = Action<"setup_app"> & { recordingId: RecordingId };
export type LoadingAction = Action<"loading"> & { loading: number };
export type SetSessionIdAction = Action<"set_session_id"> & { sessionId: SessionId };
export type UpdateThemeAction = Action<"update_theme"> & { theme: string };
export type SetSplitConsoleAction = Action<"set_split_console"> & { splitConsole: boolean };
export type SetSelectedPanelAction = Action<"set_selected_panel"> & { panel: PanelName };
export type SetSelectedPrimaryPanelAction = Action<"set_selected_primary_panel"> & {
  panel: PrimaryPanelName;
};
export type SetInitializedPanelsAction = Action<"set_initialized_panels"> & { panel: PanelName };
export type SetUploadingAction = Action<"set_uploading"> & { uploading: UploadInfo | null };
export type SetModalAction = Action<"set_modal"> & { modal: ModalType | null };
export type SetPendingNotificationAction = Action<"set_pending_notification"> & {
  location: Location;
};
export type SetAnalysisPointsAction = Action<"set_analysis_points"> & {
  analysisPoints: PointDescription[];
  location: Location;
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
export type SetPendingComment = Action<"set_pending_comment"> & { comment: PendingComment };
export type SetCanvas = Action<"set_canvas"> & { canvas: Canvas };
export type SetCommentPointer = Action<"set_comment_pointer"> & { value: boolean };
export type SetHoveredComment = Action<"set_hovered_comment"> & { comment: any };
export type SetActiveComment = Action<"set_active_comment"> & { comment: any };

export type AppAction =
  | SetupAppAction
  | LoadingAction
  | SetSessionIdAction
  | UpdateThemeAction
  | SetSplitConsoleAction
  | SetSelectedPanelAction
  | SetSelectedPrimaryPanelAction
  | SetInitializedPanelsAction
  | SetUploadingAction
  | SetModalAction
  | SetPendingNotificationAction
  | SetAnalysisPointsAction
  | SetEventsForType
  | SetViewMode
  | SetNarrowMode
  | SetHoveredLineNumberLocation
  | SetIsNodePickerActive
  | SetPendingComment
  | SetCanvas
  | SetCommentPointer
  | SetHoveredComment
  | SetActiveComment;

const NARROW_MODE_WIDTH = 800;

export function setupApp(recordingId: RecordingId, store: UIStore) {
  store.dispatch({ type: "setup_app", recordingId });
  setupPointHandlers(store);

  ThreadFront.waitForSession().then(sessionId =>
    store.dispatch({ type: "set_session_id", sessionId })
  );

  ThreadFront.ensureProcessed(undefined, regions =>
    store.dispatch(onUnprocessedRegions(regions))
  ).then(() => {
    store.dispatch({ type: "loading", loading: 100 });
  });
}

function setupPointHandlers(store: UIStore) {
  PointHandlers.onPoints = (points: PointDescription[], info: any) => {
    const { locations } = info;
    locations.forEach(
      (location: Location | null) => location && store.dispatch(setAnalysisPoints(points, location))
    );
  };

  PointHandlers.addPendingNotification = (location: any) => {
    store.dispatch(setPendingNotification(location));
  };
}

function onUnprocessedRegions({ regions }: unprocessedRegions): UIThunkAction {
  return ({ dispatch, getState }) => {
    const loading = selectors.getLoading(getState());
    const endPoint = Math.max(...regions.map(r => r.end), 0);
    if (endPoint == 0) {
      return;
    }

    const unprocessedProgress = regions.reduce(
      (sum, region) => sum + (region.end - region.begin),
      0
    );

    const processedProgress = endPoint - unprocessedProgress;
    const percentProgress = Math.max((processedProgress / endPoint) * 100, loading);
    dispatch({ type: "loading", loading: percentProgress });
  };
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

export function setModal(modalType: ModalType): SetModalAction {
  return {
    type: "set_modal",
    modal: modalType,
  };
}

export function hideModal(): SetModalAction {
  return {
    type: "set_modal",
    modal: null,
  };
}

export function setAnalysisPoints(
  points: PointDescription[],
  location: Location
): SetAnalysisPointsAction {
  return {
    type: "set_analysis_points",
    analysisPoints: points,
    location,
  };
}

export function setEventsForType(events: MouseEvent[], eventType: Event): SetEventsForType {
  return {
    type: "set_events",
    eventType,
    events,
  };
}

export function setPendingNotification(location: any): SetPendingNotificationAction {
  return {
    type: "set_pending_notification",
    location: location,
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

export function setHoveredLineNumberLocation(location: Location): SetHoveredLineNumberLocation {
  return { type: "set_hovered_line_number_location", location };
}

export function setIsNodePickerActive(active: boolean): SetIsNodePickerActive {
  return { type: "set_is_node_picker_active", active };
}

export function setPendingComment(comment: PendingComment): SetPendingComment {
  return { type: "set_pending_comment", comment };
}

export function clearPendingComment() {
  return { type: "set_pending_comment", comment: null };
}

export function setCanvas(canvas: Canvas): SetCanvas {
  return { type: "set_canvas", canvas };
}

export function setCommentPointer(value: boolean): SetCommentPointer {
  return { type: "set_comment_pointer", value };
}

export function setHoveredComment(comment: any): SetHoveredComment {
  return { type: "set_hovered_comment", comment };
}

export function setActiveComment(comment: any): SetActiveComment {
  return { type: "set_active_comment", comment };
}
