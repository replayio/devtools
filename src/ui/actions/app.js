import { ThreadFront } from "protocol/thread";
import { selectors } from "ui/reducers";

export function setupApp(recordingId, store) {
  store.dispatch({ type: "setup_app", recordingId });
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

export function setErrorMessage(message) {
  return { type: "set_error_message", message };
}
