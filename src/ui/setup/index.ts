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
import {
  FiltersState,
  MessageState,
  syncInitialMessageState,
  defaultFiltersState,
} from "devtools/client/webconsole/reducers/messages";
import { trackEvent } from "ui/utils/telemetry";
import { Recording } from "ui/types";
import { getRecording } from "ui/hooks/recordings";
import { getRecordingId } from "ui/utils/recording";
import { getReplaySession } from "ui/setup/prefs";
import type { LayoutState } from "ui/state/layout";
import { getLocalReplaySessionPrefs } from "ui/setup/prefs";
import type { TabsState } from "devtools/client/debugger/src/reducers/tabs";
import { EMPTY_TABS } from "devtools/client/debugger/src/reducers/tabs";
import { CommentsState } from "ui/state/comments";

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

export const getInitialTabsState = async (): Promise<TabsState> => {
  const session = await getReplaySession(getRecordingId()!);

  return { tabs: session?.tabs ?? EMPTY_TABS };
};

export async function getInitialCommentsState(): Promise<CommentsState> {
  const recordingId = getRecordingId()!;

  if (!recordingId) {
    return {
      hoveredComment: null,
      pendingComment: null,
    };
  }

  const session = await getReplaySession(recordingId);

  return {
    hoveredComment: null,
    pendingComment: session?.pendingComment || null,
  };
}

const getInitialFiltersState = async () => {
  const session = await getLocalReplaySessionPrefs();

  return session ? { ...defaultFiltersState, ...session.consoleFilters } : defaultFiltersState;
};

export const initialMessageState = async (
  overrides: Partial<MessageState> = {}
): Promise<MessageState> => {
  // Realistically, we only expect filters and commandHistory
  // See ui/setup/dynamic/devtools.ts
  const { filters = {}, ...otherOverrides } = overrides;

  return syncInitialMessageState({
    ...overrides,
    filters: { ...(await getInitialFiltersState()), ...filters },
  });
};

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
