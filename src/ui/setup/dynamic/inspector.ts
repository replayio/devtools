import { features, prefs } from "devtools/client/inspector/prefs";

declare global {
  interface AppHelpers {
    inspector?: {
      prefs: typeof prefs;
      features: typeof features;
    };
  }
}

window.app.inspector = { prefs, features };
