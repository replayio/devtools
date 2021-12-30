import { UIStore } from "ui/actions";
import { getRecordingId } from "ui/utils/environment";
import { prefs, features } from "ui/utils/prefs";

declare global {
  interface Window {
    app: AppHelpers;
  }
  interface AppHelpers {
    store: UIStore;
    prefs: typeof prefs;
    features: typeof features;
    dumpPrefs: () => string;
    local: () => void;
    prod: () => void;
    clearIndexedDB: () => void;
  }
}

export function setupAppHelper(store: UIStore) {
  const recordingId = getRecordingId();

  window.app = {
    store,
    prefs,
    features,

    dumpPrefs: () =>
      JSON.stringify({ features: features.toJSON(), prefs: prefs.toJSON() }, null, 2),
    local: () => {
      if (recordingId) {
        window.location.href = `http://localhost:8080/recording/${recordingId}`;
      } else {
        window.location.href = "http://localhost:8080/";
      }
    },
    prod: () => {
      if (recordingId) {
        window.location.href = `https://app.replay.io/recording/${recordingId}`;
      } else {
        window.location.href = "https://app.replay.io/";
      }
    },
    clearIndexedDB: async () => {
      const databases = await indexedDB.databases();
      databases.map(db => db.name && indexedDB.deleteDatabase(db.name));
    },
  };
}
