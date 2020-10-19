import { bindActionCreators } from "redux";
import { ThreadFront } from "protocol/thread";

import { prefs, features } from "ui/utils/prefs";
import { actions } from "ui/actions";
import { selectors } from "ui/reducers";

import {
  prefs as inspectorPrefs,
  features as inspectorFeatures,
} from "devtools/client/inspector/prefs";

export function setupAppHelper(store) {
  window.app = {
    store,
    actions: bindActionCreators(actions, store.dispatch),
    selectors: bindSelectors({ store, selectors }),
    prefs,
    features,
    threadFront: ThreadFront,
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
        window.location = `http://replay.io/view?id=${params.get("id")}`;
      } else {
        window.location = "http://replay.io/view";
      }
    },
  };
}

export function setupConsoleHelper({ store, selectors, actions }) {
  window.app.console = {
    store,
    actions: bindActionCreators(actions, store.dispatch),
    selectors: bindSelectors({ store, selectors }),
  };
}

export function setupInspectorHelper(inspector) {
  window.app.inspector = {
    store: inspector.store,

    prefs: inspectorPrefs,
    features: inspectorFeatures,
  };
}

function bindSelectors(obj) {
  return Object.keys(obj.selectors).reduce((bound, selector) => {
    bound[selector] = (a, b, c) => obj.selectors[selector](obj.store.getState(), a, b, c);
    return bound;
  }, {});
}
