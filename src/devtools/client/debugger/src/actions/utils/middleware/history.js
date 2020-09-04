/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { isDevelopment } from "devtools-environment";

/**
 * A middleware that stores every action coming through the store in the passed
 * in logging object. Should only be used for tests, as it collects all
 * action information, which will cause memory bloat.
 */
export const history = (log = []) => ({ dispatch, getState }) => {
  return next => action => {
    if (isDevelopment()) {
      log.push(action);
    }

    return next(action);
  };
};
