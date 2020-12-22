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
import { Modal, PanelName, PrimaryPanelName, ViewMode, Event } from "ui/state/app";

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
export type SetUploadingAction = Action<"set_uploading"> & { uploading: boolean };
export type SetModalAction = Action<"set_modal"> & { modal: Modal | null };
export type SetPendingNotificationAction = Action<"set_pending_notification"> & {
  location: Location;
};
export type SetAnalysisPointsAction = Action<"set_analysis_points"> & {
  analysisPoints: PointDescription[] | null;
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
  | SetHoveredLineNumberLocation;

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
    clearInterval(loadingInterval);
    store.dispatch({ type: "loading", loading: 100 });
  });

  const loadingInterval = setInterval(() => store.dispatch(bumpLoading()), 1000);
}

function setupPointHandlers(store: UIStore) {
  PointHandlers.onPoints = (points: PointDescription[], info: any) => {
    const { location } = info;
    if (location) {
      store.dispatch(setAnalysisPoints(points, location));
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
