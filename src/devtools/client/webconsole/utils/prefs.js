/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import Services from "devtools/shared/services";
import { PrefsHelper } from "devtools/client/shared/prefs";

// TODO Can this file just be deleted entirely?

const { pref } = Services;

pref("console.persistLogs", false);
pref("console.inputHistoryCount", true);
pref("console.input.editor", false);
pref("console.timestampMessages", true);
pref("console.timestampsVisible", false);
pref("console.input.context", true);

export const prefs = new PrefsHelper("console", {
  persistLogs: ["Bool", "persistLogs"],
  inputHistoryCount: ["Bool", "inputHistoryCount"],
  editor: ["Bool", "input.editor"],
  timestampMessages: ["Bool", "timestampMessages"],
  timestampsVisible: ["Bool", "timestampsVisible"],
  inputContext: ["Bool", "input.context"],
});
