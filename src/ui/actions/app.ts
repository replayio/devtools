import { Action } from "redux";
import { UIStore, UIThunkAction } from ".";
import {
  RecordingId,
  sessionError,
  SessionId,
  unprocessedRegions,
  PointDescription,
} from "record-replay-protocol";
import { ThreadFront } from "protocol/thread";
import { selectors } from "ui/reducers";
import { ExpectedError, Modal, PanelName } from "ui/state/app";
const { PointHandlers } = require("protocol/logpoint");

export type SetupAppAction = Action<"setup_app"> & { recordingId: RecordingId };
export type SetupAppAction2 = Action<"setup_app"> & { recordingId: RecordingId };
export type LoadingAction = Action<"loading"> & { loading: number };
export type SetSessionIdAction = Action<"set_session_id"> & { sessionId: SessionId };
export type UpdateThemeAction = Action<"update_theme"> & { theme: string };
export type SetToolboxOpenAction = Action<"set_toolbox_open"> & { isToolboxOpen: boolean };
export type SetSplitConsoleAction = Action<"set_split_console"> & { splitConsole: boolean };
export type SetSelectedPanelAction = Action<"set_selected_panel"> & { panel: PanelName };
export type SetExpectedErrorAction = Action<"set_expected_error"> & { error: ExpectedError };
export type SetUnexpectedErrorAction = Action<"set_unexpected_error"> & { error: sessionError };
export type SetUploadingAction = Action<"set_uploading"> & { uploading: boolean };
export type SetModalAction = Action<"set_modal"> & { modal: Modal | null };
export type SetLastAnalysisPointsAction = Action<"set_last_analysis_points"> & {
  lastAnalysisPoints: PointDescription[] | null;
};
export type SetPendingNotificationAction = Action<"set_pending_notification"> & { location: any };
export type SetAnalysisPoints = Action<"set_analysis_points"> & {
  analysisPoints: PointDescription[][] | null;
};
export type AppAction =
  | SetupAppAction
  | LoadingAction
  | SetSessionIdAction
  | UpdateThemeAction
  | SetToolboxOpenAction
  | SetSplitConsoleAction
  | SetSelectedPanelAction
  | SetExpectedErrorAction
  | SetUnexpectedErrorAction
  | SetUploadingAction
  | SetModalAction
  | SetLastAnalysisPointsAction
  | SetPendingNotificationAction
  | SetAnalysisPoints;

export function setupApp(recordingId: RecordingId, store: UIStore) {
  store.dispatch({ type: "setup_app", recordingId });
  setupPointHandlers(store);

  ThreadFront.waitForSession().then(sessionId =>
    store.dispatch({ type: "set_session_id", sessionId })
  );

  ThreadFront.ensureProcessed(undefined, regions =>
    store.dispatch(onUnprocessedRegions(regions))
  ).then(() => {
    clearInterval(loadingInterval);
    store.dispatch({ type: "loading", loading: 100 });
  });

  const loadingInterval = setInterval(() => store.dispatch(bumpLoading()), 1000);
}

function setupPointHandlers(store: UIStore) {
  PointHandlers.onPoints = (points: PointDescription[]) => {
    if (!points[0].frame?.length) {
      return;
    }

    const location = points[0].frame[0];
    const pendingNotificationLocation = selectors.getPendingNotification(store.getState());

    if (
      location?.line == pendingNotificationLocation?.line &&
      location?.scriptId == pendingNotificationLocation?.sourceId &&
      location?.column == pendingNotificationLocation?.column
    ) {
      store.dispatch(setLastAnalysisPoints(points));
      store.dispatch(setPendingNotification(null));
    }
  };
  PointHandlers.addPendingNotification = (location: any) => {
    store.dispatch(setPendingNotification(location));
  };
}

function bumpLoading(): UIThunkAction {
  return ({ dispatch, getState }) => {
    const loading = selectors.getLoading(getState());
    const increment = Math.random() * 4;

    dispatch({ type: "loading", loading: Math.min(loading + increment, 99) });
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

export function setToolboxOpen(isToolboxOpen: boolean): SetToolboxOpenAction {
  return { type: "set_toolbox_open", isToolboxOpen };
}

export function setSplitConsole(open: boolean): SetSplitConsoleAction {
  return { type: "set_split_console", splitConsole: open };
}

export function setSelectedPanel(panel: PanelName): SetSelectedPanelAction {
  return { type: "set_selected_panel", panel };
}

export function setExpectedError(error: ExpectedError): SetExpectedErrorAction {
  return { type: "set_expected_error", error };
}

export function setUnexpectedError(error: sessionError): SetUnexpectedErrorAction {
  return { type: "set_unexpected_error", error };
}

export function setUploading(uploading: boolean): SetUploadingAction {
  return { type: "set_uploading", uploading };
}

export function setSharingModal(recordingId: RecordingId): SetModalAction {
  return {
    type: "set_modal",
    modal: {
      type: "sharing",
      recordingId,
      opaque: false,
    },
  };
}

export function hideModal(): SetModalAction {
  return {
    type: "set_modal",
    modal: null,
  };
}

export function setLastAnalysisPoints(points: PointDescription[]): SetLastAnalysisPointsAction {
  return {
    type: "set_last_analysis_points",
    lastAnalysisPoints: points,
  };
}

export function setPendingNotification(location: any): SetPendingNotificationAction {
  return {
    type: "set_pending_notification",
    location: location,
  };
}