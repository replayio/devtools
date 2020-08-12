import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import { prefs as dbgPrefs } from "devtools/client/debugger/src/utils/prefs";
import { prefs, features } from "./prefs";
import configureStore from "devtools/client/debugger/src/actions/utils/create-store";
import { bindActionCreators, combineReducers } from "redux";
import { reducers, selectors } from "../reducers";
import { actions } from "../actions";
import App from "ui/components/App";

const initialState = {};

function setupAppHelper(store) {
  window.app = {
    store,
    actions: bindActionCreators(actions, store.dispatch),
    selectors: bindSelectors({ store, selectors }),
    prefs,
    features,
    dumpPrefs: () =>
      JSON.stringify({ features: features.toJSON(), prefs: prefs.toJSON() }, null, 2),
    local: () => {
      const params = new URLSearchParams(document.location.search.substring(1));
      window.location = `http://localhost:8080/index.html?id=${params.get("id")}`;
    },
    prod: () => {
      const params = new URLSearchParams(document.location.search.substring(1));
      window.location = `http://replay.io/view?id=${params.get("id")}`;
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

function bindSelectors(obj) {
  return Object.keys(obj.selectors).reduce((bound, selector) => {
    bound[selector] = (a, b, c) => obj.selectors[selector](obj.store.getState(), a, b, c);
    return bound;
  }, {});
}

function bootstrapStore() {
  const createStore = configureStore({
    log: dbgPrefs.logging,
    timing: dbgPrefs.timing,
    makeThunkArgs: (args, state) => {
      return { ...args };
    },
  });

  const store = createStore(combineReducers(reducers), initialState);
  registerStoreObserver(store, updatePrefs);

  setupAppHelper(store);

  return store;
}

export function bootstrapApp(props) {
  const store = bootstrapStore();

  ReactDOM.render(
    React.createElement(Provider, { store }, React.createElement(App, props)),
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
  const { isSplitConsoleOpen, getSelectedPanel } = selectors;
  if (isSplitConsoleOpen(state) != isSplitConsoleOpen(oldState)) {
    prefs.splitConsole = isSplitConsoleOpen(state);
  }

  if (getSelectedPanel(state) != getSelectedPanel(oldState)) {
    prefs.selectedPanel = getSelectedPanel(state);
  }
}
