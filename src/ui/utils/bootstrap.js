import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";

import {
  prefs as dbgPrefs,
  features as dbgFeatures,
} from "devtools/client/debugger/src/utils/prefs";
import {
  prefs as inspectorPrefs,
  features as inspectorFeatures,
} from "devtools/client/inspector/prefs";

import { prefs, features, asyncStore } from "./prefs";
import configureStore from "devtools/client/debugger/src/actions/utils/create-store";
import { clientCommands } from "devtools/client/debugger/src/client/firefox/commands";
import { bindActionCreators, combineReducers, applyMiddleware } from "redux";
import { reducers, selectors } from "../reducers";
import { actions } from "../actions";
import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/apm";
import { ThreadFront } from "protocol/thread";

import App from "ui/components/App";
import Auth0ProviderWithHistory from "./auth0";
import LogRocket from "logrocket";
import setupLogRocketReact from "logrocket-react";

const url = new URL(window.location.href);
const test = url.searchParams.get("test");

async function getInitialState() {
  const eventListenerBreakpoints = await asyncStore.eventListenerBreakpoints;
  return {
    eventListenerBreakpoints,
  };
}

function setupLogRocket() {
  if (test || url.hostname == "localhost") {
    return;
  }

  LogRocket.init("4sdo4i/replay");

  setupLogRocketReact(LogRocket);
  LogRocket.getSessionURL(sessionURL => {
    Sentry.configureScope(scope => {
      scope.setExtra("sessionURL", sessionURL);
    });
  });
}

export function setupSentry(context) {
  const ignoreList = ["Current thread has paused or resumed", "Current thread has changed"];

  if (test || url.hostname == "localhost") {
    return;
  }

  Sentry.init({
    dsn: "https://41c20dff316f42fea692ef4f0d055261@o437061.ingest.sentry.io/5399075",
    integrations: [new Integrations.Tracing()],
    tracesSampleRate: 1.0,
    beforeSend(event) {
      if (event) {
        const exceptionValue = event?.exception.values[0].value;
        if (ignoreList.some(ignore => exceptionValue.includes(ignore))) {
          return null;
        }
      }

      return event;
    },
  });

  Sentry.setContext("recording", { ...context, url: window.location.href });
}

function setupAppHelper(store) {
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

async function bootstrapStore() {
  const createStore = configureStore({
    log: dbgPrefs.logging,
    timing: dbgPrefs.timing,
    makeThunkArgs: (args, state) => {
      return { ...args, client: clientCommands };
    },
  });

  const initialState = await getInitialState();
  const store = createStore(
    combineReducers(reducers),
    initialState,
    applyMiddleware(LogRocket.reduxMiddleware())
  );
  registerStoreObserver(store, updatePrefs);

  setupAppHelper(store);

  return store;
}

function getRedirectUri() {
  const { host, pathname, protocol } = window.location;
  return protocol + "//" + host + pathname;
}

export async function bootstrapApp(props, context) {
  const store = await bootstrapStore();
  setupSentry(context);
  setupLogRocket();

  ReactDOM.render(
    <Router>
      <Auth0ProviderWithHistory>
        <Provider store={store}>{React.createElement(App, props)}</Provider>
      </Auth0ProviderWithHistory>
    </Router>,
    document.querySelector("#app")
  );

  return store;
}

function registerStoreObserver(store, subscriber) {
  let oldState = store.getState();
  store.subscribe(() => {
    const state = store.getState();
    subscriber(state, oldState);
    oldState = state;
  });
}

function updatePrefs(state, oldState) {
  function updatePref(field, selector) {
    if (selector(state) != selector(oldState)) {
      prefs[field] = selector(state);
    }
  }
  function updateAsyncPref(field, selector) {
    if (selector(state) != selector(oldState)) {
      asyncStore[field] = selector(state);
    }
  }

  updatePref("splitConsole", selectors.isSplitConsoleOpen);
  updatePref("user", selectors.getUser);
  updatePref("selectedPanel", selectors.getSelectedPanel);
  updateAsyncPref("eventListenerBreakpoints", state => state.eventListenerBreakpoints);
}
