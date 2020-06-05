/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// @flow

import { PROMISE } from "./utils/middleware/promise";
import type { ThunkArgs } from "./types";

/**
 *
 * @memberof actions/pause
 * @static
 */
export function logExceptions(
  shouldLogExceptions: boolean,
) {
  return ({ dispatch, getState, client }: ThunkArgs) => {
    return dispatch({
      type: "LOG_EXCEPTIONS",
      shouldLogExceptions,
      [PROMISE]: client.logExceptions(shouldLogExceptions),
    });
  };
}
