/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

import { FilterState } from "devtools/client/webconsole/reducers/filters";
import { UiState } from "devtools/client/webconsole/reducers/ui";
import { prefs } from "devtools/client/webconsole/utils/prefs";

export function getConsoleInitialState() {
  return {
    filters: FilterState({
      error: prefs.filterError,
      warn: prefs.filterWarn,
      info: prefs.filterInfo,
      debug: prefs.filterDebug,
      log: prefs.filterLog,
    }),
    consoleUI: UiState(),
  };
}
