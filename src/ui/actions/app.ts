import {
  jumpToNextPause,
  jumpToPreviousPause,
} from "devtools/client/debugger/src/actions/pause/jumps";
import { openQuickOpen } from "devtools/client/debugger/src/actions/quick-open";
import { preloadAllRecordedEventsCache } from "protocol/RecordedEventsCache";
import { ReplayClientInterface } from "shared/client/types";
import { getSystemColorScheme } from "shared/theme/getSystemColorScheme";
import { userData } from "shared/user-data/GraphQL/UserData";
import { getRecordingId } from "shared/utils/recording";
import { CommandKey } from "ui/components/CommandPalette/CommandPalette";

import { setModal, setSessionId } from "../reducers/app";
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
  const sessionId = await replayClient.waitForSession();
  store.dispatch(setSessionId(sessionId));

  // Pre-fetch recorded event data; it's used by several components later in the app
  await preloadAllRecordedEventsCache();
}

export function hideModal() {
  return setModal(null, null);
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

    dispatch(hideCommandPalette());
  };
}
