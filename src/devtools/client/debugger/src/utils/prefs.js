/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

const asyncStore = {
  pendingBreakpoints: [],
  tabs: [],
  xhrBreakpoints: new Promise(resolve => resolve([])),
  eventListenerBreakpoints: [],
};

function verifyPrefSchema() {
}

const prefs = {
  expressions: [],
  projectDirectoryRoot: "",
};

const features = {
};

module.exports = {
  asyncStore,
  verifyPrefSchema,
  prefs,
  features,
};
