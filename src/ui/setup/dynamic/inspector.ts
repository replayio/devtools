import { prefs } from "devtools/client/inspector/prefs";

declare global {
  interface AppHelpers {
    inspector?: {
      prefs: typeof prefs;
    };
  }
}

window.app.inspector = { prefs };
