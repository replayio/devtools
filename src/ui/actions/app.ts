import { UIStore, UIThunkAction } from ".";
import { unprocessedRegions, KeyboardEvent } from "@recordreplay/protocol";
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
import { onConsoleMessage } from "devtools/client/webconsole/actions/messages";
import { clearMessages, messagesLoaded } from "devtools/client/webconsole/reducers/messages";
import type { ThreadFront as ThreadFrontType } from "protocol/thread";
import { WiredMessage } from "protocol/thread/thread";
import { getTheme } from "ui/reducers/app";
import { getShowVideoPanel } from "ui/reducers/layout";
import { FocusRegion } from "ui/state/timeline";

export * from "../reducers/app";

import {
  getIsIndexed,
  getLoadingStatusSlow,
  setRecordingDuration,
  setMouseTargetsLoading,
  setLoadedRegions,
  setLoadingStatusSlow,
  updateTheme,
  setLoading,
  setSessionId,
  setModal,
  setEventsForType,
  setIsNodePickerActive,
  setCanvas as setCanvasAction,
} from "../reducers/app";

import { toggleFocusMode } from "./timeline";

const supportsPerformanceNow =
  typeof performance !== "undefined" && typeof performance.now === "function";

function now(): number {
  if (supportsPerformanceNow) {
    return performance.now();
  }
  return Date.now();
}

export const refetchDataForTimeRange = (focusRegion: FocusRegion): UIThunkAction => {
  return async (dispatch, getState, { ThreadFront }) => {
    const { endTime, startTime } = focusRegion;

    // Technically, we only need to do this in *some* circumstances.
    // I think the cases where we need to are:
    // - We are enlarging or moving the focus zone beyond what we have most recently loaded.
    // - We are shrinking the focus zone and have overflow currently.
    // That first bullet might sounds like we will end up doing this basically
    // all the time, but that is not so. Take, for instance, the case where the
    // initial load of the recording did *not* set the overflow flag. In that
    // case, we have all console messages, and we never need to fetch them
    // again. However, in order to track this properly, I suspect we will need
    // to add another piece of state to our messages slice: the boundaries that
    // were most recently used to load messages. By default, this will be the
    // entire recording, even if we start with only a small region focused.
    // That's just the way that the Console.findMessages protocol command works.
    // In that case (without overflow), like I said above, we never need to run
    // any of this code. If we have overflow, and focus on, let's say the first
    // 30 seconds of the recording, and we *don't* get overflow on the first
    // thirty seconds, then we know that if the user were to change the window
    // to the first 15 seconds, we don't need to refetch, and we also should not
    // update the "most recently loaded" boundaries in the store, because that
    // way the user could then focus on, for example, seconds 10 to 20 *also
    // without refetching*.
    // BTW - we don't have to figure out *all* of this right now :)
    dispatch(clearMessages());

    const sessionEndpoint = await sendMessage("Session.getEndpoint", {}, ThreadFront.sessionId!);

    let beginPoint: string | null = null;
    let endPoint: string | null = null;

    if (sessionEndpoint.endpoint.time === focusRegion.endTime) {
      const pointNearBeginning = await sendMessage(
        "Session.getPointNearTime",
        {
          time: startTime,
        },
        ThreadFront.sessionId!
      );

      beginPoint = pointNearBeginning.point.point;
      endPoint = sessionEndpoint.endpoint.point;
    } else {
      const [pointNearBeginning, pointNearEnd] = await Promise.all([
        sendMessage(
          "Session.getPointNearTime",
          {
            time: startTime,
          },
          ThreadFront.sessionId!
        ),
        sendMessage("Session.getPointNearTime", { time: endTime }, ThreadFront.sessionId!),
      ]);

      beginPoint = pointNearBeginning.point.point;
      endPoint = pointNearEnd.point.point;
    }

    // TODO [bvaughn] Store overflow somewhere too (for soft focus)
    // @ts-ignore TypeScript doesn't (yet) know about this return value.
    const { messages, overflow } = await sendMessage(
      "Console.findMessagesInRange",
      {
        range: { begin: beginPoint, end: endPoint },
      },
      ThreadFront.sessionId!
    );

    messages.forEach(message => dispatch(onConsoleMessage(message as WiredMessage)));
    dispatch(messagesLoaded());
  };
};

export function setupApp(store: UIStore, ThreadFront: typeof ThreadFrontType) {
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

    store.dispatch(setLoadedRegions(parameters));
  });
}

export function onUnprocessedRegions({ level, regions }: unprocessedRegions): UIThunkAction {
  return (dispatch, getState) => {
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
  return async (dispatch, getState, { ThreadFront }) => {
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
