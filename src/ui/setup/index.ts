import { bootstrapStore } from "./store";
import { registerStoreObserver, updatePrefs } from "./prefs";
import { setupAppHelper } from "./helpers";
import { setupDOMHelpers } from "./dom";
import { setTelemetryContext, setupTelemetry } from "ui/utils/telemetry";
import { UIStore } from "ui/actions";
import { getInitialAppState, getTheme, getWorkspaceId } from "ui/reducers/app";
import { setWorkspaceId } from "ui/actions/app";
import tokenManager from "ui/utils/tokenManager";
import { bootIntercom } from "ui/utils/intercom";
import { setAccessTokenInBrowserPrefs, setUserInBrowserPrefs } from "ui/utils/browser";
import { getUserInfo } from "ui/hooks/users";
import { getUserSettings } from "ui/hooks/settings";
import { isTest } from "ui/utils/environment";
import { initLaunchDarkly } from "ui/utils/launchdarkly";
import { maybeSetMixpanelContext } from "ui/utils/mixpanel";
const FontFaceObserver = require("fontfaceobserver");

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
    app: await getInitialAppState(),
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

    setAccessTokenInBrowserPrefs(typeof tokenState.token === "string" ? tokenState.token : null);

    const auth0User = tokenManager.auth0Client?.user;
    setUserInBrowserPrefs(auth0User);
    if (auth0User?.email) {
      bootIntercom({ email: auth0User.email });
    }

    const userInfo = await getUserInfo();
    if (userInfo) {
      setTelemetryContext(userInfo);
      maybeSetMixpanelContext(userInfo);

      if (!getWorkspaceId(store.getState())) {
        const userSettings = await getUserSettings();
        store.dispatch(setWorkspaceId(userSettings.defaultWorkspaceId));
      }
    }

    initLaunchDarkly();
  });

  const success = () => (document.documentElement.className += " fonts-loaded");
  if (isTest()) {
    // FontFaceObserver doesn't work in e2e tests.
    success();
  } else {
    var font1 = new FontFaceObserver("Material Icons");
    var font2 = new FontFaceObserver("Material Icons Outlined");
    Promise.all([font1.load(), font2.load()])
      .then(success)
      .catch(() => console.log("Failed to load font"));
  }

  return store;
}
