/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const actionTypes = {
  EVALUATE_EXPRESSION: "EVALUATE_EXPRESSION",
};

const prefs = {
  PREFS: {
    FILTER: {
      ERROR: "filter.error",
      WARN: "filter.warn",
      INFO: "filter.info",
      LOG: "filter.log",
      DEBUG: "filter.debug",
      CSS: "filter.css",
      NET: "filter.net",
      NODEMODULES: "filter.nodemodules",
    },
    UI: {
      // Persist is only used by the webconsole.
      PERSIST: "devtools.webconsole.persistlog",
      // Max number of entries in history list.
      INPUT_HISTORY_COUNT: "devtools.webconsole.inputHistoryCount",
      // Display timestamp in messages.
      MESSAGE_TIMESTAMP: "devtools.webconsole.timestampMessages",
      // Show the Editor onboarding UI
      EDITOR_ONBOARDING: "devtools.webconsole.input.editorOnboarding",
      // Show the Input Context the selector
      CONTEXT_SELECTOR: "devtools.webconsole.input.context",
    },
    FEATURES: {},
  },
};

const FILTERS = {
  CSS: "css",
  DEBUG: "debug",
  ERROR: "error",
  INFO: "info",
  LOG: "log",
  NET: "net",
  TEXT: "text",
  WARN: "warn",
  NODEMODULES: "nodemodules",
};

const DEFAULT_FILTERS_VALUES = {
  [FILTERS.TEXT]: "",
  [FILTERS.ERROR]: true,
  [FILTERS.WARN]: false,
  [FILTERS.LOG]: true,
  [FILTERS.INFO]: false,
  [FILTERS.DEBUG]: true,
  [FILTERS.CSS]: false,
  [FILTERS.NET]: false,
  [FILTERS.NODEMODULES]: true,
};

const DEFAULT_FILTERS = Object.keys(DEFAULT_FILTERS_VALUES).filter(
  // We make an exception for node_modules here to keep it hidden by default
  filter => DEFAULT_FILTERS_VALUES[filter] !== false || filter == "nodemodules"
);

const chromeRDPEnums = {
  MESSAGE_SOURCE: {
    XML: "xml",
    CSS: "css",
    JAVASCRIPT: "javascript",
    NETWORK: "network",
    CONSOLE_API: "console-api",
    // Messages emitted by the console frontend itself (i.e. similar messages grouping
    // header).
    CONSOLE_FRONTEND: "console-frontend",
    STORAGE: "storage",
    APPCACHE: "appcache",
    RENDERING: "rendering",
    SECURITY: "security",
    OTHER: "other",
    DEPRECATION: "deprecation",
  },
  MESSAGE_TYPE: {
    LOG: "log",
    DIR: "dir",
    TABLE: "table",
    TRACE: "trace",
    CLEAR: "clear",
    START_GROUP: "startGroup",
    START_GROUP_COLLAPSED: "startGroupCollapsed",
    END_GROUP: "endGroup",
    ASSERT: "assert",
    DEBUG: "debug",
    PROFILE: "profile",
    PROFILE_END: "profileEnd",
    // Undocumented in Chrome RDP, but is used for evaluation results.
    RESULT: "result",
    // Undocumented in Chrome RDP, but is used for input.
    COMMAND: "command",
    // Undocumented in Chrome RDP, but is used for messages that should not
    // output anything (e.g. `console.time()` calls).
    NULL_MESSAGE: "nullMessage",
    NAVIGATION_MARKER: "navigationMarker",
    LOG_POINT: "logPoint",
  },
  MESSAGE_LEVEL: {
    LOG: "log",
    ERROR: "error",
    WARN: "warn",
    DEBUG: "debug",
    INFO: "info",
  },
};

const jstermCommands = {
  JSTERM_COMMANDS: {
    INSPECT: "inspectObject",
  },
};

// Constants used for defining the direction of JSTerm input history navigation.
const historyCommands = {
  HISTORY_BACK: -1,
  HISTORY_FORWARD: 1,
};

// Combine into a single constants object
module.exports = Object.assign(
  {
    FILTERS,
    DEFAULT_FILTERS,
    DEFAULT_FILTERS_VALUES,
  },
  actionTypes,
  chromeRDPEnums,
  jstermCommands,
  prefs,
  historyCommands
);
