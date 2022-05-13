import { UIStore, UIThunkAction } from ".";
import { unprocessedRegions, KeyboardEvent } from "@recordreplay/protocol";
import { ThreadFront } from "protocol/thread/thread";
import * as selectors from "ui/reducers/app";
import { Canvas, ReplayEvent, ReplayNavigationEvent } from "ui/state/app";
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
import { getRecordingId } from "ui/utils/recording";
import { prefs } from "devtools/client/debugger/src/utils/prefs";
import { shallowEqual } from "devtools/client/debugger/src/utils/resource/compare";
import { getShowVideoPanel } from "ui/reducers/layout";
import { toggleFocusMode } from "./timeline";
import { getTheme } from "ui/reducers/app";

export * from "../reducers/app";

import {
  getIndexingProgress,
  getLoadingStatusWarning,
  setRecordingDuration,
  setMouseTargetsLoading,
  setLoadedRegions,
  setLoadingStatusWarning,
  updateTheme,
  setLoading,
  setSessionId,
  setModal,
  setEventsForType,
  setIsNodePickerActive,
  setCanvas as setCanvasAction,
} from "../reducers/app";

const supportsPerformanceNow =
  typeof performance !== "undefined" && typeof performance.now === "function";

function now(): number {
  if (supportsPerformanceNow) {
    return performance.now();
  }
  return Date.now();
}

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
    store.dispatch(setSessionId(sessionId));

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

  // The backend doesn't give up on loading and indexing; apparently it keeps trying until the entire session errors.
  // Practically speaking though, there are cases where updates take so long it feels like things are broken.
  // In that case the UI should show an error state.
  //
  // We can rely on the fact that even when loading takes a long time, we should still be getting regular progress updates.
  // If too much time passes between these updates, we can infer that things are either slow, or we're in a stuck state (aka an "error" for all practical purposes).
  //
  // If another update eventually comes in we will reset the slow/timed-out flag.
  const SLOW_THRESHOLD = 2500;
  const TIMED_OUT_THRESHOLD = 10000;
  let lastLoadChangeUpdateTime = now();

  setInterval(function onLoadChangeInterval() {
    const isLoadingFinished = getIndexingProgress(store.getState()) === 100;
    if (isLoadingFinished) {
      return;
    }

    const loadingStatusWarning = getLoadingStatusWarning(store.getState());
    const currentTime = now();
    const elapsedTime = currentTime - lastLoadChangeUpdateTime;

    if (elapsedTime > TIMED_OUT_THRESHOLD) {
      if (loadingStatusWarning !== "timed-out") {
        store.dispatch(setLoadingStatusWarning("timed-out"));
      }
    } else if (elapsedTime > SLOW_THRESHOLD) {
      if (loadingStatusWarning !== "slow") {
        store.dispatch(setLoadingStatusWarning("slow"));
      }
    } else {
      if (loadingStatusWarning !== null) {
        store.dispatch(setLoadingStatusWarning(null));
      }
    }
  }, 1000);

  ThreadFront.listenForLoadChanges(parameters => {
    lastLoadChangeUpdateTime = now();

    store.dispatch(setLoadedRegions(parameters));
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

  Object.entries(groupedEvents).map(([eventType, kindEvents]) => {
    const keyboardEvents = [
      ...selectors.getEventsForType(store.getState(), eventType),
      ...kindEvents,
    ];
    keyboardEvents.sort((a: ReplayEvent, b: ReplayEvent) =>
      compareBigInt(BigInt(a.point), BigInt(b.point))
    );

    store.dispatch(setEventsForType({ events: keyboardEvents, eventType }));
  });
}

function onNavigationEvents(events: ReplayNavigationEvent[], store: UIStore) {
  const currentNavEvents: ReplayNavigationEvent[] = events.map(e => ({ ...e, kind: "navigation" }));
  const newNavEvents = [
    ...selectors.getEventsForType(store.getState(), "navigation"),
    ...currentNavEvents,
  ];
  newNavEvents.sort((a, b) => compareBigInt(BigInt(a.point), BigInt(b.point)));

  store.dispatch(setEventsForType({ events: newNavEvents, eventType: "navigation" }));
}

export function toggleTheme(): UIThunkAction {
  return (dispatch, getState) => {
    const theme = getTheme(getState());
    const newTheme = theme == "dark" ? "light" : "dark";
    dispatch(updateTheme(newTheme));
  };
}

export function hideModal() {
  return setModal(null, null);
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
