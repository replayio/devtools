import { RecordingId } from "@replayio/protocol";
import equals from "fast-deep-equal";
import debounce from "lodash/debounce";

import type { PartialLocation } from "devtools/client/debugger/src/actions/sources";
import { Tab, getTabs } from "devtools/client/debugger/src/reducers/tabs";
import { persistTabs } from "devtools/client/debugger/src/utils/tabs";
import { asyncStoreHelper } from "devtools/shared/async-store-helper";
import { ViewMode } from "shared/user-data/GraphQL/config";
import { getRecordingId } from "shared/utils/recording";
import { UIStore } from "ui/actions";
import {
  getLocalNags,
  getSelectedPanel,
  getSelectedPrimaryPanel,
  getToolboxLayout,
  getViewMode,
} from "ui/reducers/layout";
import { UIState } from "ui/state";
import { PrimaryPanelName, SecondaryPanelName, ToolboxLayout } from "ui/state/layout";

export interface ReplaySessions {
  [id: string]: ReplaySession;
}
export interface ReplaySession {
  viewMode: ViewMode;
  toolboxLayout: ToolboxLayout;
  selectedPrimaryPanel: PrimaryPanelName | null;
  selectedPanel: SecondaryPanelName;
  localNags: LocalNag[];
  tabs: Tab[];
  persistedSelectedLocation: PartialLocation | null;
}

function initializeAsyncStore() {
  const asyncStore = asyncStoreHelper("devtools", {
    replaySessions: ["Json", "replay-sessions", {} as Record<string, ReplaySession>],
  });

  let cachedValue: ReplaySessions | null = null;

  async function readAsyncStore(): Promise<ReplaySessions> {
    if (cachedValue !== null) {
      return cachedValue;
    }

    cachedValue = await asyncStore.replaySessions;

    return cachedValue!;
  }

  function writeAsyncStore(value: ReplaySessions): void {
    cachedValue = value;

    writeAsyncStoreDebounced(value);
  }

  const writeAsyncStoreDebounced = debounce((value: ReplaySessions) => {
    asyncStore.replaySessions = value;
  }, 250);

  return {
    readAsyncStore,
    writeAsyncStore,
  };
}

const { readAsyncStore, writeAsyncStore } = initializeAsyncStore();

export async function getReplaySession(
  recordingId: RecordingId
): Promise<ReplaySession | undefined> {
  const replaySessions = await readAsyncStore();
  return replaySessions[recordingId];
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

export const updatePrefs = (state: UIState, oldState: UIState) => {
  onReduxStateChange(state);
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

  const replaySessions = await readAsyncStore();
  const replaySession = replaySessions[recordingId];

  // If for some reason we don't have this replay session, return
  // true so that our default state is to behave as if we wanted to hide
  // the local nag.
  if (!replaySession) {
    return true;
  }

  return replaySession.localNags.includes(nag);
}

async function onReduxStateChange(state: UIState) {
  const recordingId = getRecordingId();
  if (!recordingId) {
    return;
  }

  const prevReplaySessions = await readAsyncStore();
  const prevReplaySession = prevReplaySessions[recordingId];
  const nextReplaySession = {
    viewMode: getViewMode(state),
    toolboxLayout: getToolboxLayout(state),
    selectedPrimaryPanel: getSelectedPrimaryPanel(state),
    selectedPanel: getSelectedPanel(state),
    localNags: getLocalNags(state),
    tabs: persistTabs(getTabs(state)) || [],
    persistedSelectedLocation: state.sources?.persistedSelectedLocation || null,
  };

  if (!equals(prevReplaySession, nextReplaySession)) {
    writeAsyncStore({ ...prevReplaySessions, [recordingId]: nextReplaySession });
  }
}
