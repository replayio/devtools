/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import React from "react";
import { combineReducers, applyMiddleware } from "redux";
import { Provider } from "react-redux";
import LogRocket from "logrocket";

import * as search from "../workers/search";
import { ParserDispatcher } from "../workers/parser";

import configureStore from "../actions/utils/create-store";
import reducers from "../reducers";
import * as selectors from "../selectors";
import App from "../components/App";
import { asyncStore, prefs } from "./prefs";
import { persistTabs } from "../utils/tabs";

let parser;

export function bootstrapStore(client, workers, panel, initialState) {
  const createStore = configureStore({
    log: prefs.logging,
    timing: prefs.timing,
    makeThunkArgs: (args, state) => {
      return { ...args, client, ...workers, panel };
    },
  });

  const store = createStore(
    combineReducers(reducers),
    initialState,
    applyMiddleware(LogRocket.reduxMiddleware())
  );
  store.subscribe(() => updatePrefs(store.getState()));


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

let currentPendingBreakpoints;
let currentXHRBreakpoints;
let currentTabs;

export function updatePrefs(state) {
  const previousPendingBreakpoints = currentPendingBreakpoints;
  const previousXHRBreakpoints = currentXHRBreakpoints;
  const previousTabs = currentTabs;
  currentPendingBreakpoints = selectors.getPendingBreakpoints(state);
  currentXHRBreakpoints = selectors.getXHRBreakpoints(state);
  currentTabs = selectors.getTabs(state);

  if (previousPendingBreakpoints && currentPendingBreakpoints !== previousPendingBreakpoints) {
    asyncStore.pendingBreakpoints = currentPendingBreakpoints;
  }

  if (previousTabs && previousTabs !== currentTabs) {
    asyncStore.tabs = persistTabs(currentTabs);
  }

  if (currentXHRBreakpoints !== previousXHRBreakpoints) {
    asyncStore.xhrBreakpoints = currentXHRBreakpoints;
  }
}
