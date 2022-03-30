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
} from "ui/reducers/layout";
import { ToolboxLayout, ViewMode } from "ui/state/layout";
import { persistTabs } from "devtools/client/debugger/src/utils/tabs";
import { getTabs } from "devtools/client/debugger/src/reducers/tabs";

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

export function updatePrefs(state: UIState, oldState: UIState) {
  function updatePref(field: keyof typeof prefs, selector: Function) {
    const newValue = selector(state);
    if (newValue != selector(oldState)) {
      prefs[field] = newValue;
    }
  }

  function updateWebconsolePref(field: keyof typeof webconsolePrefs, selector: Function) {
    const newValue = selector(state);
    if (newValue != selector(oldState)) {
      webconsolePrefs[field] = newValue;
    }
  }

  function updateAsyncPref(field: keyof typeof asyncStore, selector: Function) {
    const newValue = selector(state);
    if (newValue != selector(oldState)) {
      asyncStore[field] = newValue;
    }
  }

  updatePref("viewMode", getViewMode);

  updateAsyncPref("eventListenerBreakpoints", (state: UIState) => state.eventListenerBreakpoints);
  updateAsyncPref("commandHistory", (state: UIState) => state.messages?.commandHistory);

  // This is lazy-loaded, so it may not exist on startup
  if (state.consoleUI && oldState.consoleUI) {
    updateWebconsolePref("timestampsVisible", (state: UIState) => {
      return state.consoleUI.timestampsVisible;
    });
  }

  if (state.messages?.filters && oldState.messages?.filters) {
    updateWebconsolePref("filterError", (state: UIState) => state.messages.filters.error);
    updateWebconsolePref("filterWarn", (state: UIState) => state.messages.filters.warn);
    updateWebconsolePref("filterInfo", (state: UIState) => state.messages.filters.info);
    updateWebconsolePref("filterDebug", (state: UIState) => state.messages.filters.debug);
    updateWebconsolePref("filterLog", (state: UIState) => state.messages.filters.log);
    updateWebconsolePref(
      "filterNodeModules",
      (state: UIState) => state.messages.filters.nodemodules
    );
  }

  maybeUpdateReplaySessions(state);
}

async function getReplaySessions() {
  return await asyncStore.replaySessions;
}

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

// This allows us to insert a local nag on a per session (replay) basis.
export async function dismissLocalNag(nag: LocalNag) {
  const recordingId = getRecordingId();

  // Bail if we're not in a recording.
  if (!recordingId) {
    return;
  }

  const previousReplaySessions = await getReplaySessions();
  const previousReplaySession = previousReplaySessions[recordingId];

  const updatedReplaySession = {
    ...previousReplaySession,
    localNags: [
      ...previousReplaySession.localNags,
      ...(!previousReplaySession.localNags.includes(nag) ? [nag] : []),
    ],
  };

  asyncStore.replaySessions = { ...previousReplaySessions, [recordingId]: updatedReplaySession };
}

async function maybeUpdateReplaySessions(state: UIState) {
  const recordingId = getRecordingId();

  // Bail if we're not in a recording.
  if (!recordingId) {
    return;
  }

  const previousReplaySessions = await getReplaySessions();
  const previousReplaySession = previousReplaySessions[recordingId];

  const currentReplaySession = {
    viewMode: getViewMode(state),
    consoleFilterDrawerExpanded: getConsoleFilterDrawerExpanded(state),
    toolboxLayout: getToolboxLayout(state),
    showVideoPanel: getShowVideoPanel(state),
    selectedPrimaryPanel: getSelectedPrimaryPanel(state),
    selectedPanel: getSelectedPanel(state),
    localNags: [...(previousReplaySession?.localNags || [])],
    tabs: persistTabs(getTabs(state)) || [],
  };

  asyncStore.replaySessions = { ...previousReplaySessions, [recordingId]: currentReplaySession };
}
