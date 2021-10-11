import { UIStore } from "ui/actions";
import { UIState } from "ui/state";
import { prefs, asyncStore } from "ui/utils/prefs";
import {
  getSelectedPanel,
  getShowEditor,
  getShowVideoPanel,
  getViewMode,
  isSplitConsoleOpen,
} from "ui/reducers/app";
import { getRecordingId } from "ui/utils/environment";
import { ViewMode } from "ui/state/app";

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

export async function updatePrefs(state: UIState, oldState: UIState) {
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

  await updateReplaySessions(state);
}

async function updateReplaySessions(state: UIState) {
  const recordingId = getRecordingId();
  const previousReplaySessions = await asyncStore.replaySessions;
  const currentReplaySession = {
    viewMode: getViewMode(state),
    showEditor: getShowEditor(state),
    showVideoPanel: getShowVideoPanel(state),
  };

  asyncStore.replaySessions = { ...previousReplaySessions, [recordingId!]: currentReplaySession };
}
