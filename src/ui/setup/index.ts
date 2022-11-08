import {
  CallStack,
  loadedRegions as LoadedRegions,
  Location,
  PauseData,
  PauseId,
} from "@replayio/protocol";

import { cachePauseData } from "bvaughn-architecture-demo/src/suspense/PauseCache";
import { preCacheExecutionPointForTime } from "bvaughn-architecture-demo/src/suspense/PointsCache";
import type { TabsState } from "devtools/client/debugger/src/reducers/tabs";
import { EMPTY_TABS } from "devtools/client/debugger/src/reducers/tabs";
import { ThreadFront } from "protocol/thread";
import { addPauseDataListener } from "protocol/thread/pause";
import { ReplayClient } from "shared/client/ReplayClient";
import { replayClient } from "shared/client/ReplayClientContext";
import { UIStore } from "ui/actions";
import { getRecording } from "ui/hooks/recordings";
import { getUserSettings } from "ui/hooks/settings";
import { getUserInfo } from "ui/hooks/users";
import { getTheme, initialAppState } from "ui/reducers/app";
import { syncInitialLayoutState } from "ui/reducers/layout";
import { getCorrespondingSourceIds } from "ui/reducers/sources";
import { getReplaySession } from "ui/setup/prefs";
import type { LayoutState } from "ui/state/layout";
import { Recording } from "ui/types";
import { setAccessTokenInBrowserPrefs, setUserInBrowserPrefs } from "ui/utils/browser";
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

const getDefaultSelectedPrimaryPanel = (session: any, recording?: Recording) => {
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

  const { viewMode, showVideoPanel, toolboxLayout, selectedPanel } = syncInitialLayoutState;
  const initialViewMode = session.viewMode || viewMode;
  trackEvent(initialViewMode == "dev" ? "layout.default_devtools" : "layout.default_viewer");

  return {
    ...syncInitialLayoutState,
    viewMode: initialViewMode,
    selectedPanel: "selectedPanel" in session ? session.selectedPanel : selectedPanel,
    selectedPrimaryPanel: getDefaultSelectedPrimaryPanel(session, recording),
    showVideoPanel: "showVideoPanel" in session ? session.showVideoPanel : showVideoPanel,
    toolboxLayout: "toolboxLayout" in session ? session.toolboxLayout : toolboxLayout,
    localNags: "localNags" in session ? session.localNags : [],
  };
}

export const getInitialTabsState = async (): Promise<TabsState> => {
  const session = await getReplaySession(getRecordingId()!);

  return { tabs: session?.tabs ?? EMPTY_TABS };
};

export async function bootstrapApp() {
  const initialState = {
    app: initialAppState,
    layout: await getInitialLayoutState(),
    tabs: await getInitialTabsState(),
  };

  const store = bootstrapStore(initialState);

  if (typeof window === "undefined") {
    return store;
  }

  // Connect data in legacy Redux stores (like PauseData or points) to the newer Suspense caches.
  // This avoids requiring the new components from requesting redundant data.
  // In the case of PauseData, it's extra important– because the backend won't re-send the same data twice no matter how many times you ask for it.
  addPauseDataListener((pauseId: PauseId, pauseData: PauseData, stack?: CallStack) => {
    cachePauseData(replayClient, pauseId, pauseData, stack);
  });

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

  ThreadFront.getCorrespondingSourceIds = (sourceId: string) => {
    return getCorrespondingSourceIds(store.getState(), sourceId);
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

      setTelemetryContext(userInfo);
      maybeSetMixpanelContext({ ...userInfo, workspaceId });
    }

    initLaunchDarkly();
  });

  return store;
}
