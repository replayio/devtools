import { UIStore } from "ui/actions";
import { prefs, features } from "ui/utils/prefs";
const { client } = require("protocol/socket");

declare global {
  interface Window {
    app: AppHelpers;
  }
  interface AppHelpers {
    store: UIStore;
    prefs: typeof prefs;
    features: typeof features;
    client: typeof client;
    dumpPrefs: () => string;
    local: () => void;
    prod: () => void;
  }
}

export function setupAppHelper(store: UIStore) {
  window.app = {
    store,
    prefs,
    features,
    client,

    dumpPrefs: () =>
      JSON.stringify({ features: features.toJSON(), prefs: prefs.toJSON() }, null, 2),
    local: () => {
      const params = new URLSearchParams(document.location.search.substring(1));

      if (params.get("id")) {
        window.location.href = `http://localhost:8080/index.html?id=${params.get("id")}`;
      } else {
        window.location.href = "http://localhost:8080/index.html";
      }
    },
    prod: () => {
      const params = new URLSearchParams(document.location.search.substring(1));

      if (params.get("id")) {
        window.location.href = `http://app.replay.io/?id=${params.get("id")}`;
      } else {
        window.location.href = "http://app.replay.io/";
      }
    },
  };
}
