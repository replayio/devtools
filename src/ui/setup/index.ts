import { bootstrapStore } from "./store";
import { registerStoreObserver, updatePrefs } from "./prefs";
import { setupAppHelper } from "./helpers";
import { setupDOMHelpers } from "./dom";
import { setTelemetryContext, setupTelemetry } from "ui/utils/telemetry";
import { UIStore } from "ui/actions";
import { getTheme, getWorkspaceId, initialAppState } from "ui/reducers/app";
import { setWorkspaceId } from "ui/actions/app";
import tokenManager from "ui/utils/tokenManager";
import { setAccessTokenInBrowserPrefs, setUserInBrowserPrefs } from "ui/utils/browser";
import { getUserInfo } from "ui/hooks/users";
import { getUserSettings } from "ui/hooks/settings";
import { initLaunchDarkly } from "ui/utils/launchdarkly";
import { maybeSetMixpanelContext } from "ui/utils/mixpanel";
import { syncInitialLayoutState } from "ui/reducers/layout";
import {
  MessageState,
  syncInitialMessageState,
  defaultFiltersState,
} from "devtools/client/webconsole/reducers/messages";
import { trackEvent } from "ui/utils/telemetry";
import { Recording } from "ui/types";
import { getRecordingId } from "ui/utils/recording";
import { getReplaySession } from "ui/setup/prefs";
import type { LayoutState } from "ui/state/layout";
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

export function getInitialLayoutState(session: any): LayoutState {
  if (!session) {
    return syncInitialLayoutState;
  }

  const getSessionPrefWithFallback = (pref: keyof LayoutState) => {
    if (pref in session) {
      return session[pref];
    } else {
      return syncInitialLayoutState[pref];
    }
  };

  trackEvent(
    getSessionPrefWithFallback("viewMode") == "dev"
      ? "layout.default_devtools"
      : "layout.default_viewer"
  );

  return {
    ...syncInitialLayoutState,
    consoleFilterDrawerExpanded: getSessionPrefWithFallback("consoleFilterDrawerExpanded"),
    viewMode: getSessionPrefWithFallback("viewMode"),
    selectedPanel: getSessionPrefWithFallback("selectedPanel"),
    selectedPrimaryPanel: getSessionPrefWithFallback("selectedPrimaryPanel"),
    showVideoPanel: getSessionPrefWithFallback("showVideoPanel"),
    toolboxLayout: getSessionPrefWithFallback("toolboxLayout"),
    localNags: getSessionPrefWithFallback("localNags"),
  };
}

export const getInitialTabsState = (session: any): TabsState => {
  return { tabs: session?.tabs ?? EMPTY_TABS };
};

export function getInitialCommentsState(session: any): CommentsState {
  if (!session) {
    return {
      hoveredComment: null,
      pendingComment: null,
    };
  }

  return {
    hoveredComment: null,
    pendingComment: session?.pendingComment || null,
  };
}

const getInitialFiltersState = (session: any) => {
  return session ? { ...defaultFiltersState, ...session.consoleFilters } : defaultFiltersState;
};

export const initialMessageState = (
  session: any,
  overrides: Partial<MessageState> = {}
): MessageState => {
  // Realistically, we only expect filters and commandHistory
  // See ui/setup/dynamic/devtools.ts
  const { filters = {} } = overrides;

  return syncInitialMessageState({
    ...overrides,
    filters: { ...getInitialFiltersState(session), ...filters },
  });
};

export async function bootstrapApp() {
  const recordingId = getRecordingId();
  const session = recordingId ? await getReplaySession(recordingId) : null;

  const initialState = {
    app: initialAppState,
    comments: getInitialCommentsState(session),
    layout: getInitialLayoutState(session),
    messages: initialMessageState(session),
    tabs: getInitialTabsState(session),
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
