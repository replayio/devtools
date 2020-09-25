/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

// State
const { FilterState } = require("devtools/client/webconsole/reducers/filters");
const { PrefState } = require("devtools/client/webconsole/reducers/prefs");
const { UiState } = require("devtools/client/webconsole/reducers/ui");

// Redux
const { applyMiddleware, compose, createStore } = require("redux");

// Prefs
const { prefs, getPrefsService } = require("devtools/client/webconsole/utils/prefs");

// Reducers
const { reducers } = require("devtools/client/webconsole/reducers/index");

// Middlewares
const { ignore } = require("devtools/client/shared/redux/middleware/ignore");
const eventTelemetry = require("devtools/client/webconsole/middleware/event-telemetry");
const historyPersistence = require("devtools/client/webconsole/middleware/history-persistence");
const { thunkWithOptions } = require("devtools/client/shared/redux/middleware/thunk-with-options");

// Enhancers
const enableBatching = require("devtools/client/webconsole/enhancers/batching");

/**
 * Create and configure store for the Console panel. This is the place
 * where various enhancers and middleware can be registered.
 */
function configureStore(webConsoleUI, options = {}) {
  const prefsService = getPrefsService(webConsoleUI);
  const { getBoolPref, getIntPref } = prefsService;

  const logLimit = 1000;
  //options.logLimit || Math.max(getIntPref("devtools.hud.loglimit"), 1);
  const sidebarToggle = prefs.sidebarToggle;
  const autocomplete = prefs.inputAutocomplete;
  const eagerEvaluation = prefs.inputEagerEvaluation;
  const groupWarnings = prefs.groupWarningMessages;
  const historyCount = prefs.historyCount;

  const initialState = {
    prefs: PrefState({
      logLimit,
      sidebarToggle,
      autocomplete,
      eagerEvaluation,
      historyCount,
      groupWarnings,
    }),
    filters: FilterState({
      error: prefs.filterError,
      warn: prefs.filterWarn,
      info: prefs.filterInfo,
      debug: prefs.filterDebug,
      log: prefs.filterLog,
      css: prefs.filterCss,
      net: prefs.filterNet,
      netxhr: prefs.filterNetxhr,
    }),
    ui: UiState({
      networkMessageActiveTabId: "headers",
      persistLogs: prefs.persistLogs,
      showContentMessages:
        webConsoleUI.isBrowserConsole || webConsoleUI.isBrowserToolboxConsole
          ? prefs.showContentMessages
          : true,
      editor: prefs.editor,
      editorWidth: prefs.editorWidth,
      showEditorOnboarding: prefs.showEditorOnboarding,
      timestampsVisible: prefs.timestampsVisible,
    }),
  };

  const toolbox = options.thunkArgs.toolbox;
  const sessionId = (toolbox && toolbox.sessionId) || -1;
  const middleware = applyMiddleware(
    ignore,
    thunkWithOptions.bind(null, {
      prefsService,
      ...options.thunkArgs,
    }),
    historyPersistence,
    eventTelemetry.bind(null, options.telemetry, sessionId)
  );

  return createStore(createRootReducer(), initialState, compose(middleware, enableBatching()));
}

function createRootReducer() {
  return function rootReducer(state, action) {
    // We want to compute the new state for all properties except
    // "messages" and "history". These two reducers are handled
    // separately since they are receiving additional arguments.
    const newState = Object.entries(reducers).reduce((res, [key, reducer]) => {
      if (key !== "messages" && key !== "history") {
        res[key] = reducer(state[key], action);
      }
      return res;
    }, {});

    // Pass prefs state as additional argument to the history reducer.
    newState.history = reducers.history(state.history, action, newState.prefs);

    // Specifically pass the updated filters, prefs and ui states as additional arguments.
    newState.messages = reducers.messages(
      state.messages,
      action,
      newState.filters,
      newState.prefs,
      newState.ui
    );

    return newState;
  };
}

// Provide the store factory for test code so that each test is working with
// its own instance.
module.exports.configureStore = configureStore;
