import { ThreadFront } from "protocol/thread";
import { selectors } from "ui/reducers";
const { PointHandlers } = require("protocol/logpoint");

export function setupApp(recordingId, store) {
  store.dispatch({ type: "setup_app", recordingId });
  setupPointHandlers(store);

  ThreadFront.waitForSession().then(sessionId =>
    store.dispatch({ type: "set_session_id", sessionId })
  );
  ThreadFront.ensureProcessed(_, regions => store.dispatch(onUnprocessedRegions(regions))).then(
    () => {
      clearInterval(loadingInterval);
      store.dispatch({ type: "loading", loading: 100 });
    }
  );

  const loadingInterval = setInterval(() => store.dispatch(bumpLoading()), 1000);
}

function setupPointHandlers(store) {
  PointHandlers.onPoints = (points, info) => {
    if (points.length == 0) {
      // ...
    }
    // const location = points[0].frame[0];
    const { location } = info;
    const pendingNotificationLocation = selectors.getPendingNotification(store.getState());

    if (
      location.line == pendingNotificationLocation.line &&
      location.column == pendingNotificationLocation.column &&
      location.scriptId == pendingNotificationLocation.sourceId
    ) {
      store.dispatch(setLastAnalysisPoints(points, location));
      store.dispatch(setPendingNotification(null));
    }
  };
  PointHandlers.addPendingNotification = location => {
    store.dispatch(setPendingNotification(location));
  };
}

function bumpLoading() {
  return ({ dispatch, getState }) => {
    const loading = selectors.getLoading(getState());
    const increment = Math.random() * 4;

    dispatch({ type: "loading", loading: Math.min(loading + increment, 99) });
  };
}

function onUnprocessedRegions({ regions }) {
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

export function updateTheme(theme) {
  return { type: "update_theme", theme };
}

export function setToolboxOpen(isToolboxOpen) {
  return { type: "set_toolbox_open", isToolboxOpen };
}

export function setSplitConsole(open) {
  return { type: "set_split_console", splitConsole: open };
}

export function setSelectedPanel(panel) {
  return { type: "set_selected_panel", panel };
}

export function setExpectedError(error) {
  return { type: "set_expected_error", error };
}

export function setUnexpectedError(error) {
  return { type: "set_unexpected_error", error };
}

export function setUploading(uploading) {
  return { type: "set_uploading", uploading };
}

export function setSharingModal(recordingId) {
  return {
    type: "set_modal",
    modal: {
      type: "sharing",
      recordingId,
      opaque: false,
    },
  };
}

export function hideModal() {
  return {
    type: "set_modal",
    modal: null,
  };
}

export function setLastAnalysisPoints(points) {
  return {
    type: "set_last_analysis_points",
    lastAnalysisPoints: points,
  };
}

export function setAnalysisPoints(points, location) {
  return {
    type: "set_analysis_points",
    analysisPoints: points,
    location
  };
}


export function setPendingNotification(location) {
  return {
    type: "set_pending_notification",
    location: location,
  };
}
