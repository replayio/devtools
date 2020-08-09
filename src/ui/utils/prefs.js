/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// @flow

import { PrefsHelper, asyncStoreHelper } from "devtools-modules";

import Services from "devtools-services";

// Schema version to bump when the async store format has changed incompatibly
// and old stores should be cleared.
const { pref } = Services;

// app prefs.
pref("viewer.split-console", true);
pref("viewer.selected-panel", "debugger");

// app features
pref("viewer.features.comments", false);

export const prefs = new PrefsHelper("viewer", {
  splitConsole: ["Bool", "split-console"],
  selectedPanel: ["String", "selected-panel"],
});

export const features = new PrefsHelper("viewer", {
  comments: ["Bool", "features.comments"],
});
