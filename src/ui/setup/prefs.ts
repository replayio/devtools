import debounce from "lodash/debounce";
import { UIStore } from "ui/actions";
import { UIState } from "ui/state";
import { prefs, asyncStore } from "ui/utils/prefs";
import { prefs as webconsolePrefs } from "devtools/client/webconsole/utils/prefs";
import { getRecordingId } from "ui/utils/recording";
import {
  getConsoleFilterDrawerExpanded,
  getSelectedPanel,
  getSelectedPrimaryPanel,
  getToolboxLayout,
  getShowVideoPanel,
  getViewMode,
  getLocalNags,
} from "ui/reducers/layout";
import { ToolboxLayout, ViewMode } from "ui/state/layout";
import { persistTabs } from "devtools/client/debugger/src/utils/tabs";
import { getTabs } from "devtools/client/debugger/src/reducers/tabs";
import { getPendingComment } from "ui/reducers/comments";
import { RecordingId } from "@recordreplay/protocol";
import { getTheme } from "ui/reducers/app";
import { getAllFilters } from "devtools/client/webconsole/selectors";
import { getRecording } from "ui/hooks/recordings";

export interface ReplaySessions {
  [id: string]: ReplaySession;
}
export interface ReplaySession {
  viewMode: ViewMode;
  showVideoPanel: boolean;
  toolboxLayout: ToolboxLayout;
}

export function registerStoreObserver(
  store: UIStore,
  subscriber: (state: UIState, oldState: UIState) => void
) {
  let oldState = store.getState();
  store.subscribe(() => {
    const state = store.getState();
    subscriber(state, oldState);
    oldState = state;
  });
}

function createPrefsUpdater<T extends Record<string, any>>(prefObj: T) {
  return function updatePref(
    newState: UIState,
    oldState: UIState,
    field: keyof typeof prefObj,
    selector: (state: UIState) => T[typeof field]
  ) {
    const newValue = selector(newState);
    if (newValue != selector(oldState)) {
      prefObj[field] = newValue;
    }
  };
}

const updateStandardPrefs = createPrefsUpdater(prefs);
const updateAsyncPrefs = createPrefsUpdater(asyncStore);
const updateWebconsolePrefs = createPrefsUpdater(webconsolePrefs);

const actualUpdatePrefs = (state: UIState, oldState: UIState) => {
  updateStandardPrefs(state, oldState, "viewMode", getViewMode);
  updateStandardPrefs(state, oldState, "theme", getTheme);

  updateAsyncPrefs(
    state,
    oldState,
    "eventListenerBreakpoints",
    (state: UIState) => state.eventListenerBreakpoints
  );
  updateAsyncPrefs(
    state,
    oldState,
    "commandHistory",
    (state: UIState) => state.messages?.commandHistory
  );

  // This is lazy-loaded, so it may not exist on startup
  if (state.consoleUI && oldState.consoleUI) {
    updateWebconsolePrefs(state, oldState, "timestampsVisible", (state: UIState) => {
      return state.consoleUI.timestampsVisible;
    });
  }
  maybeUpdateReplaySessions(state);
};

// Avoid a small bit of overhead of checking prefs after _every_ dispatch
export const updatePrefs = debounce(actualUpdatePrefs, 50);

async function getReplaySessions() {
  return await asyncStore.replaySessions;
}

export async function getReplaySession(recordingId: RecordingId) {
  return (await asyncStore.replaySessions)[recordingId];
}

export const getLocalReplaySessionPrefs = async () => {
  const recordingId = getRecordingId();

  // If we're in the library, there are no preferences to fetch.
  if (!recordingId) {
    return null;
  }

  let recording;
  try {
    recording = await getRecording(recordingId);
  } catch (e) {
    return null;
  }

  const session = await getReplaySession(recordingId);

  return session;
};

export enum LocalNag {
  // Yank the user's select left sidebar panel to show the explorer (sources + outline)
  // on the first time they switch to the DevTools view, so they don't miss it.
  YANK_TO_SOURCE = "yank_to_source",
}

export async function isLocalNagDismissed(nag: LocalNag) {
  const recordingId = getRecordingId();

  // Bail if we're not in a recording.
  if (!recordingId) {
    return;
  }

  const replaySessions = await getReplaySessions();
  const replaySession = replaySessions[recordingId];

  // If for some reason we don't have this replay session, return
  // true so that our default state is to behave as if we wanted to hide
  // the local nag.
  if (!replaySession) {
    return true;
  }

  return replaySession.localNags.includes(nag);
}

async function maybeUpdateReplaySessions(state: UIState) {
  const recordingId = getRecordingId();

  // Bail if we're not in a recording.
  if (!recordingId) {
    return;
  }

  const previousReplaySessions = await getReplaySessions();

  const currentReplaySession = {
    viewMode: getViewMode(state),
    consoleFilterDrawerExpanded: getConsoleFilterDrawerExpanded(state),
    toolboxLayout: getToolboxLayout(state),
    showVideoPanel: getShowVideoPanel(state),
    selectedPrimaryPanel: getSelectedPrimaryPanel(state),
    selectedPanel: getSelectedPanel(state),
    localNags: getLocalNags(state),
    tabs: persistTabs(getTabs(state)) || [],
    pendingComment: getPendingComment(state),
    consoleFilters: getAllFilters(state),
  };

  asyncStore.replaySessions = { ...previousReplaySessions, [recordingId]: currentReplaySession };
}
