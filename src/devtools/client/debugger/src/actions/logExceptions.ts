/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { UIStore } from "ui/actions";
import { UIThunkAction } from "ui/actions";

import { exceptionLogpointErrorCleared } from "devtools/client/webconsole/reducers/messages";
import { PROMISE } from "ui/setup/redux/middleware/promise";

import { clientCommands } from "../client/commands";
import { getShouldLogExceptions } from "../reducers/pause";

export function setupExceptions(store: UIStore) {
  if (getShouldLogExceptions(store.getState())) {
    clientCommands.logExceptions(true);
  }
}

/**
 *
 * @memberof actions/pause
 * @static
 */
export function logExceptions(shouldLogExceptions: boolean): UIThunkAction {
  return (dispatch, getState, { client }) => {
    dispatch(exceptionLogpointErrorCleared());

    return dispatch({
      [PROMISE]: client.logExceptions(shouldLogExceptions),
      shouldLogExceptions,
      type: "LOG_EXCEPTIONS",
    });
  };
}
