/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// 

import React from "react";
import { bindActionCreators, combineReducers } from "redux";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import ToolboxProvider from "devtools/client/framework/store-provider";
import { isDevelopment } from "devtools-environment";
import { AppConstants } from "devtools-modules";

import * as search from "../workers/search";
import { ParserDispatcher } from "../workers/parser";

import configureStore from "../actions/utils/create-store";
import reducers from "../reducers";
import * as selectors from "../selectors";
import App from "../components/App";
import { asyncStore, prefs } from "./prefs";
import { persistTabs } from "../utils/tabs";


let parser;

function renderPanel(component, store, panel) {
  const root = document.createElement("div");
  root.className = "launchpad-root theme-body";
  root.style.setProperty("flex", "1");
  const mount = document.querySelector("#mount");
  if (!mount) {
    return;
  }
  mount.appendChild(root);

  ReactDOM.render(
    React.createElement(
      Provider,
      { store },
      React.createElement(
        ToolboxProvider,
        { store: panel.getToolboxStore() },
        React.createElement(component)
      )
    ),
    root
  );
}


export function bootstrapStore(client, workers, panel, initialState) {
  const createStore = configureStore({
    log: prefs.logging,
    timing: prefs.timing,
    makeThunkArgs: (args, state) => {
      return { ...args, client, ...workers, panel };
    },
  });

  const store = createStore(combineReducers(reducers), initialState);
  store.subscribe(() => updatePrefs(store.getState()));

  const actions = bindActionCreators(require("../actions").default, store.dispatch);

  return { store, actions, selectors };
}

export function bootstrapWorkers(panelWorkers) {
  const workerPath = "dist";

  parser = new ParserDispatcher();

  parser.start(`${workerPath}/parserWorker.js`);
  search.start(`${workerPath}/searchWorker.js`);
  return { ...panelWorkers, parser, search };
}

export function teardownWorkers() {
  parser.stop();
  search.stop();
}

export function bootstrapApp(store) {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
}

let currentPendingBreakpoints;
let currentXHRBreakpoints;
let currentEventBreakpoints;
let currentTabs;

function updatePrefs(state) {
  const previousPendingBreakpoints = currentPendingBreakpoints;
  const previousXHRBreakpoints = currentXHRBreakpoints;
  const previousEventBreakpoints = currentEventBreakpoints;
  const previousTabs = currentTabs;
  currentPendingBreakpoints = selectors.getPendingBreakpoints(state);
  currentXHRBreakpoints = selectors.getXHRBreakpoints(state);
  currentTabs = selectors.getTabs(state);

  if (previousPendingBreakpoints && currentPendingBreakpoints !== previousPendingBreakpoints) {
    asyncStore.pendingBreakpoints = currentPendingBreakpoints;
  }

  currentEventBreakpoints = state.eventListenerBreakpoints;
  if (previousEventBreakpoints && previousEventBreakpoints !== currentEventBreakpoints) {
    asyncStore.eventListenerBreakpoints = currentEventBreakpoints;
  }

  if (previousTabs && previousTabs !== currentTabs) {
    asyncStore.tabs = persistTabs(currentTabs);
  }

  if (currentXHRBreakpoints !== previousXHRBreakpoints) {
    asyncStore.xhrBreakpoints = currentXHRBreakpoints;
  }
}
