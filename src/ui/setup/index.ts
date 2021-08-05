import { bootstrapStore } from "./store";
import { registerStoreObserver, updatePrefs } from "./prefs";
import { setupAppHelper } from "./helpers";
import { setupDOMHelpers } from "./dom";
import { UIStore } from "ui/actions";
import { getTheme } from "ui/reducers/app";
import { setModal } from "ui/actions/app";
import { setupTelemetry } from "ui/utils/telemetry";

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
}
