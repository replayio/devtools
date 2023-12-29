import { KeyboardEvent } from "@replayio/protocol";
import groupBy from "lodash/groupBy";

import {
  jumpToNextPause,
  jumpToPreviousPause,
} from "devtools/client/debugger/src/actions/pause/jumps";
import { openQuickOpen } from "devtools/client/debugger/src/actions/quick-open";
import { ReplayClientInterface } from "shared/client/types";
import { getSystemColorScheme } from "shared/theme/getSystemColorScheme";
import { userData } from "shared/user-data/GraphQL/UserData";
import { shallowEqual } from "shared/utils/compare";
import { CommandKey } from "ui/components/CommandPalette/CommandPalette";
import { getEventsForType } from "ui/reducers/app";
import { Canvas, EventKind, ReplayEvent, ReplayNavigationEvent } from "ui/state/app";
import { compareBigInt } from "ui/utils/helpers";
import { getRecordingId } from "ui/utils/recording";

import {
  loadReceivedEvents,
  setCanvas as setCanvasAction,
  setModal,
  setSessionId,
} from "../reducers/app";
import {
  hideCommandPalette,
  setSelectedPanel,
  setSelectedPrimaryPanel,
  setToolboxLayout,
  setViewMode,
} from "./layout";
import { toggleFocusMode } from "./timeline";
import { UIStore, UIThunkAction } from ".";

export * from "../reducers/app";

export async function setupApp(store: UIStore, replayClient: ReplayClientInterface) {
  replayClient.waitForSession().then(sessionId => {
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
  const newNavEvents = [...getEventsForType(store.getState(), "navigation"), ...currentNavEvents];
  newNavEvents.sort((a, b) => compareBigInt(BigInt(a.point), BigInt(b.point)));

  store.dispatch(loadReceivedEvents({ navigation: newNavEvents }));
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

export function setBreakpointsFromClipboard(): UIThunkAction {
  return async () => {
    // TODO [FE-998] Figure out a new implementation that works with IndexedDB instead
    /*
    const currentFocusedElement = document.activeElement;
    let text = "";
    try {
      // The `readText()` API requires that the current DOM be focused somehow
      document.body.focus();
      text = await navigator.clipboard.readText();

      // Was the clipboard data even valid JSON?
      const parsedValue = JSON.parse(text);
      // Assuming it was JSON, does it appear to be an array of Point objects?
      if (Array.isArray(parsedValue) && parsedValue.every(isValidPoint)) {
        // TODO [FE-874] This will need to change if we modify how we do per-recording persistence

        // This value appears to be actual breakpoints. Our current implementation watches
        //  for changes in `localStorage` and will auto-update itself when that event fires.
        const storageKey = `${ThreadFront.recordingId!}::points`;
        // Just reuse the text from the clipboard
        localStorage.setItem(storageKey, text);
        // Apparently the "storage" event only fires across tabs, and setting a value
        // in the _same_ tab won't trigger it. Do that manually:
        window.dispatchEvent(new Event("storage"));
      }
    } catch (err) {
      if (err instanceof SyntaxError) {
        console.error("Could not parse clipboard text as JSON:", `"${text}"`);
      } else if (err instanceof DOMException) {
        console.error("Could not copy clipboard text - document not focused", err);
      } else {
        console.error(err);
      }
    } finally {
      if (currentFocusedElement && "focus" in currentFocusedElement) {
        (currentFocusedElement as HTMLElement).focus();
      }
    }
    */
  };
}

export function copyBreakpointsToClipboard(): UIThunkAction {
  return async () => {
    // TODO [FE-998] Figure out a new implementation that works with IndexedDB instead
    /*
    const storageKey = `${ThreadFront.recordingId!}::points`;
    const currentPointsValue = localStorage.getItem(storageKey);
    if (currentPointsValue) {
      await navigator.clipboard.writeText(currentPointsValue);
    }
    */
  };
}

export function executeCommand(key: CommandKey): UIThunkAction {
  return async (dispatch, getState) => {
    const recordingId = getRecordingId();

    if (key === "open_console") {
      dispatch(setViewMode("dev"));
      dispatch(setSelectedPanel("console"));
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
    } else if (key === "open_outline") {
      dispatch(setViewMode("dev"));
      dispatch(setSelectedPrimaryPanel("explorer"));
      userData.set("layout_debuggerOutlineExpanded", true);
    } else if (key == "toggle_protocol_panel") {
      userData.toggle("feature_protocolPanel");
    } else if (key == "toggle_protocol_timeline") {
      userData.toggle("feature_protocolTimeline");
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
    } else if (key === "toggle_dark_mode") {
      let theme = userData.get("global_theme");
      if (theme === "system") {
        theme = getSystemColorScheme();
      }
      userData.set("global_theme", theme === "dark" ? "light" : "dark");
    } else if (key === "pin_to_bottom") {
      dispatch(setToolboxLayout("bottom"));
    } else if (key === "pin_to_left") {
      dispatch(setToolboxLayout("left"));
    } else if (key === "pin_to_bottom_right") {
      dispatch(setToolboxLayout("ide"));
    } else if (key === "jump_to_previous_pause") {
      dispatch(jumpToPreviousPause());
    } else if (key === "jump_to_next_pause") {
      dispatch(jumpToNextPause());
    } else if (key == "restart_session") {
      // navigate to the url with an additional search param
      const url = new URL(window.location.href);
      url.searchParams.append("restart", "true");
      window.location.href = url.toString();
    }
    // else if (key === "copy_points") {
    //   dispatch(copyBreakpointsToClipboard());
    // } else if (key === "set_points") {
    //   dispatch(setBreakpointsFromClipboard());
    // }

    dispatch(hideCommandPalette());
  };
}
