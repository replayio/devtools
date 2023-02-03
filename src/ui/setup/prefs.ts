import { RecordingId } from "@replayio/protocol";
import debounce from "lodash/debounce";

import type { PartialLocation } from "devtools/client/debugger/src/actions/sources";
import { Tab, getTabs } from "devtools/client/debugger/src/reducers/tabs";
import { prefs as debuggerPrefs } from "devtools/client/debugger/src/utils/prefs";
import { persistTabs } from "devtools/client/debugger/src/utils/tabs";
import { UIStore } from "ui/actions";
import { getTheme } from "ui/reducers/app";
import {
  getLocalNags,
  getSelectedPanel,
  getSelectedPrimaryPanel,
  getToolboxLayout,
  getViewMode,
} from "ui/reducers/layout";
import { UIState } from "ui/state";
import { PrimaryPanelName, SecondaryPanelName, ToolboxLayout, ViewMode } from "ui/state/layout";
import { asyncStore, prefs } from "ui/utils/prefs";
import { getRecordingId } from "ui/utils/recording";

export interface ReplaySessions {
  [id: string]: ReplaySession;
}
export interface ReplaySession {
  viewMode: ViewMode;
  toolboxLayout: ToolboxLayout;
  selectedPrimaryPanel: PrimaryPanelName;
  selectedPanel: SecondaryPanelName;
  localNags: LocalNag[];
  tabs: Tab[];
  persistedSelectedLocation: PartialLocation | null;
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
    const oldValue = selector(oldState);
    if (newValue != oldValue) {
      prefObj[field] = newValue;
    }
  };
}

const updateStandardPrefs = createPrefsUpdater(prefs);
const updateDebuggerPrefs = createPrefsUpdater(debuggerPrefs);

export const updatePrefs = (state: UIState, oldState: UIState) => {
  updateStandardPrefs(state, oldState, "theme", getTheme);

  if (state.ui && oldState.ui) {
    updateDebuggerPrefs(
      state,
      oldState,
      "frameworkGroupingOn",
      state => state.ui.frameworkGroupingOn
    );

    updateDebuggerPrefs(state, oldState, "sourcesCollapsed", state => state.ui.sourcesCollapsed);

    updateDebuggerPrefs(
      state,
      oldState,
      "pendingSelectedLocation",
      // TS types say `null` isn't acceptable to persist, but it seems to work at runtime
      state => state.sources.persistedSelectedLocation as any
    );
  }

  maybeUpdateReplaySessions(state);
};

let replaySessions: ReplaySessions;
async function getReplaySessions() {
  if (replaySessions) {
    return replaySessions;
  }
  replaySessions = await asyncStore.replaySessions;
  return replaySessions;
}

export async function getReplaySession(
  recordingId: RecordingId
): Promise<ReplaySession | undefined> {
  return (await asyncStore.replaySessions)[recordingId];
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

const updateReplaySessions = debounce(value => (asyncStore.replaySessions = value), 1_000);

async function maybeUpdateReplaySessions(state: UIState) {
  const recordingId = getRecordingId();

  // Bail if we're not in a recording.
  if (!recordingId) {
    return;
  }

  const previousReplaySessions = await getReplaySessions();

  const currentReplaySession = {
    viewMode: getViewMode(state),
    toolboxLayout: getToolboxLayout(state),
    selectedPrimaryPanel: getSelectedPrimaryPanel(state),
    selectedPanel: getSelectedPanel(state),
    localNags: getLocalNags(state),
    tabs: persistTabs(getTabs(state)) || [],
    persistedSelectedLocation: state.sources?.persistedSelectedLocation || null,
  };

  const newState = { ...previousReplaySessions, [recordingId]: currentReplaySession };
  await updateReplaySessions(newState);
}
