import { loadedRegions as LoadedRegions, Location, SourceId } from "@replayio/protocol";

import type { TabsState } from "devtools/client/debugger/src/reducers/tabs";
import { EMPTY_TABS } from "devtools/client/debugger/src/reducers/tabs";
import { ThreadFront } from "protocol/thread";
import { CONSOLE_SETTINGS_DATABASE } from "replay-next/src/contexts/ConsoleFiltersContext";
import { POINTS_DATABASE } from "replay-next/src/contexts/points/constants";
import { preloadIDBInitialValues } from "replay-next/src/hooks/useIndexedDB";
import { preCacheExecutionPointForTime } from "replay-next/src/suspense/ExecutionPointsCache";
import { ReplayClient } from "shared/client/ReplayClient";
import { replayClient } from "shared/client/ReplayClientContext";
import { Recording } from "shared/graphql/types";
import { UIStore } from "ui/actions";
import { getRecording } from "ui/hooks/recordings";
import { getUserSettings } from "ui/hooks/settings";
import { getUserInfo } from "ui/hooks/users";
import { getTheme, initialAppState } from "ui/reducers/app";
import { syncInitialLayoutState } from "ui/reducers/layout";
import {
  SourcesState,
  getCorrespondingSourceIds,
  getSourceDetails,
  initialState as initialSourcesState,
  isOriginalSource,
  isPrettyPrintedSource,
} from "ui/reducers/sources";
import { ReplaySession, getReplaySession } from "ui/setup/prefs";
import type { LayoutState } from "ui/state/layout";
import { setUserInBrowserPrefs } from "ui/utils/browser";
import { initLaunchDarkly } from "ui/utils/launchdarkly";
import { maybeSetMixpanelContext } from "ui/utils/mixpanel";
import { getPreferredLocation } from "ui/utils/preferredLocation";
import { getRecordingId } from "ui/utils/recording";
import { setTelemetryContext, setupTelemetry } from "ui/utils/telemetry";
import { trackEvent } from "ui/utils/telemetry";
import tokenManager from "ui/utils/tokenManager";

import { setupDOMHelpers } from "./dom";
import { setupAppHelper } from "./helpers";
import { registerStoreObserver, updatePrefs } from "./prefs";
import { bootstrapStore } from "./store";

declare global {
  interface Window {
    store: UIStore;
  }
}

// Just to grab the type of Dispatch
let store: UIStore;
export type AppDispatch = typeof store.dispatch;

const getDefaultSelectedPrimaryPanel = (
  session: ReplaySession | undefined,
  recording?: Recording
) => {
  if (session) {
    return session.selectedPrimaryPanel;
  }

  if (!recording) {
    return syncInitialLayoutState.selectedPrimaryPanel;
  }

  return recording.comments.length ? "comments" : syncInitialLayoutState.selectedPrimaryPanel;
};

export async function getInitialLayoutState(): Promise<LayoutState> {
  const recordingId = getRecordingId();

  // If we're in the library, there are no preferences to fetch.
  if (!recordingId) {
    return syncInitialLayoutState;
  }

  let recording;
  try {
    recording = await getRecording(recordingId);
  } catch (e) {
    return syncInitialLayoutState;
  }

  const session = await getReplaySession(recordingId);

  if (!session) {
    return {
      ...syncInitialLayoutState,
      selectedPrimaryPanel: getDefaultSelectedPrimaryPanel(session, recording),
    };
  }

  const { viewMode, toolboxLayout, selectedPanel } = syncInitialLayoutState;
  const initialViewMode = session.viewMode || viewMode;
  trackEvent(initialViewMode == "dev" ? "layout.default_devtools" : "layout.default_viewer");

  return {
    ...syncInitialLayoutState,
    viewMode: initialViewMode,
    selectedPanel: "selectedPanel" in session ? session.selectedPanel : selectedPanel,
    selectedPrimaryPanel: getDefaultSelectedPrimaryPanel(session, recording),
    toolboxLayout: "toolboxLayout" in session ? session.toolboxLayout : toolboxLayout,
    localNags: "localNags" in session ? session.localNags : [],
  };
}

export const getInitialTabsState = async (): Promise<TabsState> => {
  const session = await getReplaySession(getRecordingId()!);

  return { tabs: session?.tabs ?? EMPTY_TABS };
};

export const getInitialSourcesState = async (): Promise<SourcesState> => {
  const session = await getReplaySession(getRecordingId()!);

  if (!session) {
    return initialSourcesState;
  }

  return {
    ...initialSourcesState,
    persistedSelectedLocation:
      "persistedSelectedLocation" in session ? session.persistedSelectedLocation : null,
  };
};

const IDB_PREFS_DATABASES = [CONSOLE_SETTINGS_DATABASE, POINTS_DATABASE];

export async function bootstrapApp() {
  const recordingId = getRecordingId();

  // Load all async/IDB prefs in parallel before we continue.
  // We don't actively use the `idbPrefsPromises` data here,
  // as that is used in the `useIndexedDB` hook in components.
  const [initialLayoutState, initialTabsState, initialSourcesState] = await Promise.all([
    getInitialLayoutState(),
    getInitialTabsState(),
    getInitialSourcesState(),
    preloadIDBInitialValues(IDB_PREFS_DATABASES, recordingId!),
  ] as const);

  const initialState = {
    app: initialAppState,
    layout: initialLayoutState,
    tabs: initialTabsState,
    sources: initialSourcesState,
  };

  const store = bootstrapStore(initialState);

  if (typeof window === "undefined") {
    return store;
  }

  // Listen for changes in loaded regions and pre-caches the points.
  ThreadFront.listenForLoadChanges((loadedRegions: LoadedRegions) => {
    loadedRegions.indexed.forEach(({ begin, end }) => {
      preCacheExecutionPointForTime(begin);
      preCacheExecutionPointForTime(end);
    });
    loadedRegions.loaded.forEach(({ begin, end }) => {
      preCacheExecutionPointForTime(begin);
      preCacheExecutionPointForTime(end);
    });
    loadedRegions.loading.forEach(({ begin, end }) => {
      preCacheExecutionPointForTime(begin);
      preCacheExecutionPointForTime(end);
    });
  });

  // Wire up new Console and Object Inspector to the Redux logic for preferred source.
  (replayClient as ReplayClient).injectGetPreferredLocation(
    (locations: Location[]) => getPreferredLocation(locations) || null
  );

  ThreadFront.getCorrespondingSourceIds = (sourceId: SourceId) => {
    return getCorrespondingSourceIds(store.getState(), sourceId);
  };
  ThreadFront.isOriginalSource = (sourceId: SourceId) => {
    const sourceDetails = getSourceDetails(store.getState(), sourceId);
    return sourceDetails != null && isOriginalSource(sourceDetails);
  };
  ThreadFront.isPrettyPrintedSource = (sourceId: SourceId) => {
    const sourceDetails = getSourceDetails(store.getState(), sourceId);
    return sourceDetails != null && isPrettyPrintedSource(sourceDetails);
  };

  setupTelemetry();
  setupDOMHelpers();

  window.store = store;

  registerStoreObserver(store, updatePrefs);
  await setupAppHelper(store);

  const theme = getTheme(store.getState());
  document.body.parentElement!.className = theme || "";

  tokenManager.addListener(async tokenState => {
    if (tokenState.loading || tokenState.error) {
      return;
    }

    const auth0User = tokenManager.auth0Client?.user;
    setUserInBrowserPrefs(auth0User);

    const userInfo = await getUserInfo();
    if (userInfo) {
      const userSettings = await getUserSettings();
      const workspaceId = userSettings.defaultWorkspaceId;
      const role = userSettings.role;

      setTelemetryContext(userInfo);
      maybeSetMixpanelContext({ ...userInfo, workspaceId, role });
    }

    initLaunchDarkly();
  });

  return store;
}
