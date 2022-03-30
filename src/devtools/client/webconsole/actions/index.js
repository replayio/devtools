/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const actionModules = [
  // These are now RTK "slices" exporting their action creators
  require("devtools/client/webconsole/reducers/ui"),
  require("devtools/client/webconsole/reducers/messages"),

  require("devtools/client/webconsole/actions/input"),
  require("devtools/client/webconsole/actions/messages"),
  require("devtools/client/webconsole/actions/toolbox"),
];

const actions = Object.assign({}, ...actionModules);

module.exports = actions;
