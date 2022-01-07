/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { PROMISE } from "ui/setup/redux/middleware/promise";
const { getShouldLogExceptions } = require("../reducers/pause");
const { clientCommands } = require("../client/commands");

export function setupExceptions(store) {
  if (getShouldLogExceptions(store.getState())) {
    clientCommands.logExceptions(true);
  }
}

/**
 *
 * @memberof actions/pause
 * @static
 */
export function logExceptions(shouldLogExceptions) {
  return ({ dispatch, getState, client }) => {
    return dispatch({
      type: "LOG_EXCEPTIONS",
      shouldLogExceptions,
      [PROMISE]: client.logExceptions(shouldLogExceptions),
    });
  };
}
