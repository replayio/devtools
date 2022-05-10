import { bootstrapStore } from "./store";
import { registerStoreObserver, updatePrefs } from "./prefs";
import { setupAppHelper } from "./helpers";
import { setupDOMHelpers } from "./dom";
import { setTelemetryContext, setupTelemetry } from "ui/utils/telemetry";
import { UIStore } from "ui/actions";
import { getTheme, getWorkspaceId, initialAppState } from "ui/reducers/app";
import { setWorkspaceId } from "ui/actions/app";
import tokenManager from "ui/utils/tokenManager";
import { bootIntercom } from "ui/utils/intercom";
import { setAccessTokenInBrowserPrefs, setUserInBrowserPrefs } from "ui/utils/browser";
import { getUserInfo } from "ui/hooks/users";
import { getUserSettings } from "ui/hooks/settings";
import { initLaunchDarkly } from "ui/utils/launchdarkly";
import { maybeSetMixpanelContext } from "ui/utils/mixpanel";
import { syncInitialLayoutState } from "ui/reducers/layout";
import { getInitialTabsState } from "devtools/client/debugger/src/reducers/tabs";
import { getInitialCommentsState } from "ui/reducers/comments";
import { initialMessageState } from "devtools/client/webconsole/reducers/messages";
import { trackEvent } from "ui/utils/telemetry";
import { Recording } from "ui/types";
import { getRecording } from "ui/hooks/recordings";
import { getRecordingId } from "ui/utils/recording";
import { getReplaySession } from "ui/setup/prefs";
import type { LayoutState } from "ui/state/layout";

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

  const { viewMode, showVideoPanel, toolboxLayout, selectedPanel, consoleFilterDrawerExpanded } =
    syncInitialLayoutState;
  const initialViewMode = session.viewMode || viewMode;
  trackEvent(initialViewMode == "dev" ? "layout.default_devtools" : "layout.default_viewer");

  return {
    ...syncInitialLayoutState,
    consoleFilterDrawerExpanded:
      "consoleFilterDrawerExpanded" in session
        ? session.consoleFilterDrawerExpanded
        : consoleFilterDrawerExpanded,
    viewMode: initialViewMode,
    selectedPanel: "selectedPanel" in session ? session.selectedPanel : selectedPanel,
    selectedPrimaryPanel: getDefaultSelectedPrimaryPanel(session, recording),
    showVideoPanel: "showVideoPanel" in session ? session.showVideoPanel : showVideoPanel,
    toolboxLayout: "toolboxLayout" in session ? session.toolboxLayout : toolboxLayout,
    localNags: "localNags" in session ? session.localNags : [],
  };
}

export async function bootstrapApp() {
  const initialState = {
    app: initialAppState,
    comments: await getInitialCommentsState(),
    layout: await getInitialLayoutState(),
    messages: await initialMessageState(),
    tabs: await getInitialTabsState(),
  };

  const store = bootstrapStore(initialState);

  if (typeof window === "undefined") {
    return store;
  }

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

    if (typeof tokenState.token === "string") {
      setAccessTokenInBrowserPrefs(tokenState.token);
    }

    const auth0User = tokenManager.auth0Client?.user;
    setUserInBrowserPrefs(auth0User);
    if (auth0User?.email) {
      bootIntercom({ email: auth0User.email });
    }

    const userInfo = await getUserInfo();
    if (userInfo) {
      let workspaceId = getWorkspaceId(store.getState());
      if (!workspaceId) {
        const userSettings = await getUserSettings();
        store.dispatch(setWorkspaceId(userSettings.defaultWorkspaceId));
        workspaceId = userSettings.defaultWorkspaceId;
      }

      setTelemetryContext(userInfo);
      maybeSetMixpanelContext({ ...userInfo, workspaceId });
    }

    initLaunchDarkly();
  });

  return store;
}
