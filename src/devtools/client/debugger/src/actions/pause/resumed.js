/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { isStepping, getPauseReason, getThreadContext } from "../../selectors";
import { inDebuggerEval } from "../../utils/pause";

/**
 * Debugger has just resumed
 *
 * @memberof actions/pause
 * @static
 */
export function resumed() {
  return async dispatch => {
    dispatch({ type: "RESUME" });
  };
}
