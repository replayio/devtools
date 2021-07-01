import { bindActionCreators } from "redux";
import { ThreadFront } from "protocol/thread";

import { prefs, features } from "ui/utils/prefs";
import { actions } from "ui/actions";
import { selectors } from "ui/reducers";
import { prefs as consolePrefs } from "devtools/client/webconsole/utils/prefs";
import { setupDebuggerHelper } from "devtools/client/debugger/src/utils/dbg";
import {
  prefs as inspectorPrefs,
  features as inspectorFeatures,
} from "devtools/client/inspector/prefs";

export function setupAppHelper(store) {
  window.app = {
    actions: bindActionCreators(actions, store.dispatch),
    selectors: bindSelectors({ store, selectors }),
    threadFront: ThreadFront,
    store,
    prefs,
    features,
    console: {
      prefs: consolePrefs,
    },
    debugger: setupDebuggerHelper(),
    inspector: {
      prefs: inspectorPrefs,
      features: inspectorFeatures,
    },

    dumpPrefs: () =>
      JSON.stringify({ features: features.toJSON(), prefs: prefs.toJSON() }, null, 2),
    local: () => {
      const params = new URLSearchParams(document.location.search.substring(1));

      if (params.get("id")) {
        window.location = `http://localhost:8080/index.html?id=${params.get("id")}`;
      } else {
        window.location = "http://localhost:8080/index.html";
      }
    },
    prod: () => {
      const params = new URLSearchParams(document.location.search.substring(1));

      if (params.get("id")) {
        window.location = `http://app.replay.io/?id=${params.get("id")}`;
      } else {
        window.location = "http://app.replay.io/";
      }
    },
  };
}

function bindSelectors(obj) {
  return Object.keys(obj.selectors).reduce((bound, selector) => {
    bound[selector] = (a, b, c) => obj.selectors[selector](obj.store.getState(), a, b, c);
    return bound;
  }, {});
}
