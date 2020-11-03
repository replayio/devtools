/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const { filters } = require("devtools/client/webconsole/reducers/filters");
const { messages } = require("devtools/client/webconsole/reducers/messages");
const { prefs } = require("devtools/client/webconsole/reducers/prefs");
const { ui } = require("devtools/client/webconsole/reducers/ui");
const {
  default: objectInspector,
} = require("devtools/client/debugger/packages/devtools-reps/src/object-inspector/reducer");

exports.reducers = {
  filters,
  messages,
  prefs,
  consoleUI: ui,
  objectInspector,
};
