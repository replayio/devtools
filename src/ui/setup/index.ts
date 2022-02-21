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
import { getInitialLayoutState } from "ui/reducers/layout";

declare global {
  interface Window {
    store: UIStore;
  }
}

// Just to grab the type of Dispatch
let store: UIStore;
export type AppDispatch = typeof store.dispatch;

export async function bootstrapApp() {
  const initialState = {
    app: initialAppState,
    layout: await getInitialLayoutState(),
  };

  const store = bootstrapStore(initialState);

  if (typeof window === "undefined") return store;

  setupTelemetry();
  setupDOMHelpers();

  window.store = store;

  registerStoreObserver(store, updatePrefs);
  setupAppHelper(store);

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
    setUserInBrowserPrefs(auth0User ?? null);
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
