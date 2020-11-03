/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import Services from "devtools-services";
import { PrefsHelper } from "devtools-modules";

// Schema version to bump when the async store format has changed incompatibly
// and old stores should be cleared.
const prefsSchemaVersion = 11;
const { pref } = Services;

pref("console.filter.error", true);
pref("console.filter.warn", true);
pref("console.filter.info", true);
pref("console.filter.log", true);
pref("console.filter.debug", true);

// Persist is only used by the webconsole.
pref("console.persistLogs", false);
// Max number of entries in history list.
pref("console.inputHistoryCount", true);
// Is editor mode enabled.
pref("console.input.editor", false);
// Display timestamp in messages.
pref("console.timestampMessages", true);

pref("console.timestampsVisible", false);

pref("console.input.context", true);

export const prefs = new PrefsHelper("console", {
  filterError: ["Bool", "filter.error"],
  filterWarn: ["Bool", "filter.warn"],
  filterInfo: ["Bool", "filter.info"],
  filterLog: ["Bool", "filter.log"],
  filterDebug: ["Bool", "filter.debug"],
  persistLogs: ["Bool", "persistLogs"],
  inputHistoryCount: ["Bool", "inputHistoryCount"],
  editor: ["Bool", "input.editor"],
  timestampMessages: ["Bool", "timestampMessages"],
  timestampsVisible: ["Bool", "timestampsVisible"],
  inputContext: ["Bool", "input.context"],
});

export function getPrefsService() {
  return {
    getBoolPref: (pref, deflt) => deflt,
    getIntPref: (pref, deflt) => deflt,
    setBoolPref: (pref, value) => { },
    setIntPref: (pref, value) => { },
    clearUserPref: pref => { },
  };
}
