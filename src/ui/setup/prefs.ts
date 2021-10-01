import { UIStore } from "ui/actions";
import { UIState } from "ui/state";
import { prefs, asyncStore } from "ui/utils/prefs";
import { getSelectedPanel, getViewMode, isSplitConsoleOpen } from "ui/reducers/app";
import { getRecordingId } from "ui/utils/environment";
import { ViewMode } from "ui/state/app";

export interface ReplaySessions {
  [id: string]: ReplaySession;
}
export interface ReplaySession {
  viewMode: ViewMode;
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

let currentReplaySessions: ReplaySessions;

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
  updatePref("splitConsole", isSplitConsoleOpen);
  updatePref("selectedPanel", getSelectedPanel);
  updateAsyncPref("eventListenerBreakpoints", (state: UIState) => state.eventListenerBreakpoints);

  const previousReplaySessions = currentReplaySessions;
  currentReplaySessions = updateReplaySessions(state, currentReplaySessions);

  if (previousReplaySessions && previousReplaySessions !== currentReplaySessions) {
    asyncStore.replaySessions = currentReplaySessions;
  }
}

function updateReplaySessions(
  state: UIState,
  currentReplaySessions: ReplaySessions
): ReplaySessions {
  const recordingId = getRecordingId();
  const currentReplaySession = { viewMode: getViewMode(state) };

  return { ...currentReplaySessions, [recordingId!]: currentReplaySession };
}
