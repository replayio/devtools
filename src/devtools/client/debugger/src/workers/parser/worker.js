/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { workerHandler } from "devtools/shared/worker-utils";

import { getSymbols, clearSymbols } from "./getSymbols";
import { setSource, clearSources } from "./sources";
import { clearASTs } from "./utils/ast";
import { hasSyntaxError } from "./validate";

function clearState() {
  clearASTs();
  clearScopes();
  clearSources();
  clearSymbols();
}

self.onmessage = workerHandler({
  clearState,
  getSymbols,
  hasSyntaxError,
  setSource,
});
