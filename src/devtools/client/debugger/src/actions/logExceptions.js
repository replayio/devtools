/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { exceptionLogpointErrorCleared } from "devtools/client/webconsole/reducers/messages";
import { PROMISE } from "ui/setup/redux/middleware/promise";

import { clientCommands } from "../client/commands";
import { getShouldLogExceptions } from "../reducers/pause";

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
  return (dispatch, getState, { client }) => {
    dispatch(exceptionLogpointErrorCleared());

    return dispatch({
      [PROMISE]: client.logExceptions(shouldLogExceptions),
      shouldLogExceptions,
      type: "LOG_EXCEPTIONS",
    });
  };
}
