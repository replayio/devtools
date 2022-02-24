import { UIStore } from "ui/actions";
import { UIState } from "ui/state";
import { prefs, asyncStore } from "ui/utils/prefs";
import { getRecordingId } from "ui/utils/recording";
import {
  getSelectedPanel,
  getSelectedPrimaryPanel,
  getShowEditor,
  getShowVideoPanel,
  getViewMode,
} from "ui/reducers/layout";
import { ViewMode } from "ui/state/layout";
import { persistTabs, Tab } from "devtools/client/debugger/src/utils/tabs";
import { selectors } from "ui/reducers";
import { getTabs } from "devtools/client/debugger/src/reducers/tabs";

export interface ReplaySessions {
  [id: string]: ReplaySession;
}
export interface ReplaySession {
  viewMode: ViewMode;
  showVideoPanel: boolean;
  showEditor: boolean;
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
    if (selector(state) != selector(oldState)) {
      prefs[field] = selector(state);
    }
  }
  function updateAsyncPref(field: keyof typeof asyncStore, selector: Function) {
    if (selector(state) != selector(oldState)) {
      asyncStore[field] = selector(state);
    }
  }

  updatePref("viewMode", getViewMode);
  updateAsyncPref("eventListenerBreakpoints", (state: UIState) => state.eventListenerBreakpoints);
  updateAsyncPref("commandHistory", (state: UIState) => state.messages?.commandHistory);

  console.log("maybe update replay sessions");
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

  console.log("maybeupdatereplay");

  const currentReplaySession = {
    viewMode: getViewMode(state),
    showEditor: getShowEditor(state),
    showVideoPanel: getShowVideoPanel(state),
    selectedPrimaryPanel: getSelectedPrimaryPanel(state),
    selectedPanel: getSelectedPanel(state),
    localNags: [...(previousReplaySession?.localNags || [])],
    tabs: persistTabs(getTabs(state)) || [],
  };

  console.log("tabs: ", persistTabs(getTabs(state)));

  asyncStore.replaySessions = { ...previousReplaySessions, [recordingId]: currentReplaySession };
}
