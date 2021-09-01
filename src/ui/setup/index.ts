import { bootstrapStore } from "./store";
import { registerStoreObserver, updatePrefs } from "./prefs";
import { setupAppHelper } from "./helpers";
import { setupDOMHelpers } from "./dom";
import { setTelemetryContext, setupTelemetry } from "ui/utils/telemetry";
import { UIStore } from "ui/actions";
import { getTheme } from "ui/reducers/app";
import { setFontLoading, setModal, setWorkspaceId } from "ui/actions/app";
import tokenManager from "ui/utils/tokenManager";
import { bootIntercom } from "ui/utils/intercom";
import { setAccessTokenInBrowserPrefs, setUserInBrowserPrefs } from "ui/utils/browser";
import { getUserInfo } from "ui/hooks/users";
import { getUserSettings } from "ui/hooks/settings";
import { isTest } from "ui/utils/environment";
const FontFaceObserver = require("fontfaceobserver");

declare global {
  interface Window {
    store: UIStore;
  }
}

const url = new URL(window.location.href);

export function bootstrapApp() {
  setupTelemetry();

  setupDOMHelpers();

  const store = bootstrapStore();
  window.store = store;

  registerStoreObserver(store, updatePrefs);

  setupAppHelper(store);

  const theme = getTheme(store.getState());
  document.body.parentElement!.className = theme || "";

  if (url.searchParams.has("settings")) {
    store.dispatch(setModal("settings"));
  }

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
    }

    const userSettings = await getUserSettings();
    store.dispatch(setWorkspaceId(userSettings.defaultWorkspaceId));
  });

  if (!isTest()) {
    var font = new FontFaceObserver("Material Icons");
    font.load().then(() => store.dispatch(setFontLoading(false)));
  } else {
    // FontFaceObserver doesn't work in e2e tests.
    store.dispatch(setFontLoading(false));
  }

  return store;
}
