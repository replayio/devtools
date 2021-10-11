import { matchPath } from "react-router-dom";
import { bootstrapStore } from "./store";
import { registerStoreObserver, ReplaySessions, updatePrefs } from "./prefs";
import { setupAppHelper } from "./helpers";
import { setupDOMHelpers } from "./dom";
import { setTelemetryContext, setupTelemetry } from "ui/utils/telemetry";
import { UIStore } from "ui/actions";
import { getTheme, getWorkspaceId } from "ui/reducers/app";
import {
  setFontLoading,
  setModal,
  setShowEditor,
  setShowVideoPanel,
  setViewMode,
  setWorkspaceId,
} from "ui/actions/app";
import tokenManager from "ui/utils/tokenManager";
import { bootIntercom } from "ui/utils/intercom";
import { setAccessTokenInBrowserPrefs, setUserInBrowserPrefs } from "ui/utils/browser";
import { getUserInfo } from "ui/hooks/users";
import { getUserSettings } from "ui/hooks/settings";
import { getRecordingId, isTest } from "ui/utils/environment";
import { initLaunchDarkly } from "ui/utils/launchdarkly";
const FontFaceObserver = require("fontfaceobserver");
import { asyncStore } from "ui/utils/prefs";

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

  // Check if we have any preferences saved for this replay and apply
  // them to the store. Todo: Do this step before we create the store.
  asyncStore.replaySessions
    .then((sessions: ReplaySessions) => {
      const session = sessions[getRecordingId()!];

      if (!session) {
        return;
      }

      store.dispatch(setViewMode(session.viewMode));
      store.dispatch(setShowVideoPanel(session.showVideoPanel));
      store.dispatch(setShowEditor(session.showEditor));
    })
    .then(() => {
      registerStoreObserver(store, updatePrefs);
      setupAppHelper(store);
    });

  const theme = getTheme(store.getState());
  document.body.parentElement!.className = theme || "";

  if (url.searchParams.has("settings")) {
    store.dispatch(setModal("settings"));
  }
  const match = matchPath<{ workspaceId: string }>(url.pathname, {
    path: "/team/:workspaceId/settings/billing",
  });
  if (match?.params.workspaceId) {
    store.dispatch(setWorkspaceId(match.params.workspaceId));
    store.dispatch(setModal("workspace-settings"));
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

    if (!getWorkspaceId(store.getState())) {
      const userSettings = await getUserSettings();
      store.dispatch(setWorkspaceId(userSettings.defaultWorkspaceId));
    }

    initLaunchDarkly();
  });

  if (!isTest()) {
    var font1 = new FontFaceObserver("Material Icons");
    var font2 = new FontFaceObserver("Material Icons Outlined");
    Promise.all([font1.load(), font2.load()]).then(() => store.dispatch(setFontLoading(false)));
  } else {
    // FontFaceObserver doesn't work in e2e tests.
    store.dispatch(setFontLoading(false));
  }

  return store;
}
