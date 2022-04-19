import { prefs, features } from "devtools/client/inspector/prefs";

declare global {
  interface AppHelpers {
    inspector?: {
      prefs: typeof prefs;
      features: typeof features;
    };
  }
}

window.app.inspector = { features, prefs };
