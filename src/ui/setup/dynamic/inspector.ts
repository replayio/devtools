import { extendStore } from "../store";
import * as inspectorReducers from "devtools/client/inspector/reducers";
import { prefs, features } from "devtools/client/inspector/prefs";

declare global {
  interface AppHelpers {
    inspector?: {
      prefs: typeof prefs;
      features: typeof features;
    };
  }
}

extendStore({}, inspectorReducers, {});

window.app.inspector = { prefs, features };
