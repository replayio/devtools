import { UIStore, UIThunkAction } from ".";
import { unprocessedRegions, KeyboardEvent, NodeBounds } from "@replayio/protocol";
import * as selectors from "ui/reducers/app";
import { Canvas, ReplayEvent, ReplayNavigationEvent, EventKind } from "ui/state/app";
import groupBy from "lodash/groupBy";
import { compareBigInt } from "ui/utils/helpers";
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
import { shallowEqual } from "devtools/client/debugger/src/utils/compare";
import { ThreadFront as ThreadFrontType } from "protocol/thread";
import { getTheme } from "ui/reducers/app";
import { getShowVideoPanel } from "ui/reducers/layout";
import { getBoundingRectsAsync } from "ui/suspense/nodeCaches";

export * from "../reducers/app";

import {
  getIsIndexed,
  getLoadingStatusSlow,
  durationSeen,
  setMouseTargetsLoading,
  setLoadedRegions,
  setLoadingStatusSlow,
  updateTheme,
  setSessionId,
  setModal,
  loadReceivedEvents,
  setIsNodePickerActive,
  setCanvas as setCanvasAction,
} from "../reducers/app";

import { toggleFocusMode } from "./timeline";
import { ReplayClientInterface } from "shared/client/types";

const supportsPerformanceNow =
  typeof performance !== "undefined" && typeof performance.now === "function";

function now(): number {
  if (supportsPerformanceNow) {
    return performance.now();
  }
  return Date.now();
}

export async function setupApp(
  store: UIStore,
  ThreadFront: typeof ThreadFrontType,
  replayClient: ReplayClientInterface
) {
  ThreadFront.waitForSession().then(sessionId => {
    store.dispatch(setSessionId(sessionId));

    replayClient
      .findKeyboardEvents(({ events }) => onKeyboardEvents(events, store))
      .then(() => {
        store.dispatch(loadReceivedKeyboardEvents());
      });
    replayClient.findNavigationEvents(({ events }) =>
      onNavigationEvents(events as ReplayNavigationEvent[], store)
    );
  });

  ThreadFront.ensureProcessed("basic", undefined, regions =>
    store.dispatch(onUnprocessedRegions(regions))
  );

  // The backend doesn't give up on loading and indexing; apparently it keeps trying until the entire session errors.
  // Practically speaking though, there are cases where updates take so long it feels like things are broken.
  // In that case the UI should show a visual indicator that the loading is slow.
  //
  // We can rely on the fact that even when loading takes a long time, we should still be getting regular progress updates.
  // If too much time passes between these updates, we can infer that things are either slow, or we're in a stuck state (aka an "error" for all practical purposes).
  //
  // If another update eventually comes in we will reset the slow/timed-out flag.
  const LOADING_STATUS_SLOW_THRESHOLD = 10000;
  let lastLoadChangeUpdateTime = now();

  setInterval(function onLoadChangeInterval() {
    const isLoadingFinished = getIsIndexed(store.getState());
    if (isLoadingFinished) {
      return;
    }

    const loadingStatusSlow = getLoadingStatusSlow(store.getState());
    const currentTime = now();
    const elapsedTime = currentTime - lastLoadChangeUpdateTime;

    if (elapsedTime > LOADING_STATUS_SLOW_THRESHOLD) {
      if (!loadingStatusSlow) {
        store.dispatch(setLoadingStatusSlow(true));
      }
    } else {
      if (loadingStatusSlow) {
        store.dispatch(setLoadingStatusSlow(false));
      }
    }
  }, 1000);

  ThreadFront.listenForLoadChanges(parameters => {
    lastLoadChangeUpdateTime = now();

    store.dispatch(durationSeen(Math.max(...parameters.loading.map(r => r.end.time))));
    store.dispatch(setLoadedRegions(parameters));
  });
}

export function onUnprocessedRegions({ level, regions }: unprocessedRegions): UIThunkAction {
  return dispatch => {
    dispatch(durationSeen(Math.max(...regions.map(r => r.end.time), 0)));
  };
}

const allKeyboardEvents: KeyboardEvent[] = [];

function onKeyboardEvents(events: KeyboardEvent[], store: UIStore) {
  allKeyboardEvents.push(...events);
}

function loadReceivedKeyboardEvents(): UIThunkAction {
  return dispatch => {
    const groupedEvents = groupBy(allKeyboardEvents, event => event.kind) as Record<
      EventKind,
      ReplayEvent[]
    >;

    for (let key of Object.keys(groupedEvents)) {
      groupedEvents[key].sort((a: ReplayEvent, b: ReplayEvent) =>
        compareBigInt(BigInt(a.point), BigInt(b.point))
      );
    }
    dispatch(loadReceivedEvents(groupedEvents));
  };
}

function onNavigationEvents(events: ReplayNavigationEvent[], store: UIStore) {
  const currentNavEvents: ReplayNavigationEvent[] = events.map(e => ({ ...e, kind: "navigation" }));
  const newNavEvents = [
    ...selectors.getEventsForType(store.getState(), "navigation"),
    ...currentNavEvents,
  ];
  newNavEvents.sort((a, b) => compareBigInt(BigInt(a.point), BigInt(b.point)));

  store.dispatch(loadReceivedEvents({ navigation: newNavEvents }));
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

export function fetchMouseTargetsForPause(): UIThunkAction<Promise<NodeBounds[] | undefined>> {
  return async (dispatch, getState, { protocolClient }) => {
    const state = getState();
    const pauseId = state.pause.id;
    const sessionId = state.app.sessionId;

    if (!sessionId || !pauseId) {
      return;
    }

    return getBoundingRectsAsync(protocolClient, sessionId, pauseId);
  };
}

export function loadMouseTargets(): UIThunkAction {
  return async (dispatch, getState, { ThreadFront, replayClient, protocolClient }) => {
    dispatch(setMouseTargetsLoading(true));
    const boundingRects = await dispatch(fetchMouseTargetsForPause());
    dispatch(setMouseTargetsLoading(false));
    if (boundingRects?.length) {
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
