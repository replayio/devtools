/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import fromPairs from "lodash/fromPairs";
import toPairs from "lodash/toPairs";

import { executeSoon } from "../../../../devtools/client/debugger/src/utils/DevToolsUtils";

let seqIdVal = 1;

function seqIdGen() {
  return seqIdVal++;
}

function filterAction(action) {
  return fromPairs(toPairs(action).filter(pair => pair[0] !== PROMISE));
}

function promiseMiddleware(storeApi) {
  return next => action => {
    if (!(PROMISE in action)) {
      return next(action);
    }

    const promiseInst = action[PROMISE];
    const seqId = seqIdGen().toString();

    // Create a new action that doesn't have the promise field and has
    // the `seqId` field that represents the sequence id
    action = { ...filterAction(action), seqId };

    storeApi.dispatch({ ...action, status: "start" });

    // Return the promise so action creators can still compose if they
    // want to.
    return Promise.resolve(promiseInst)
      .finally(() => new Promise(resolve => executeSoon(resolve)))
      .then(
        value => {
          storeApi.dispatch({ ...action, status: "done", value: value });
          return value;
        },
        error => {
          storeApi.dispatch({
            ...action,
            error: error.message || error,
            status: "error",
          });
          return Promise.reject(error);
        }
      );
  };
}

export const PROMISE = "@@dispatch/promise";
export { promiseMiddleware as promise };
