/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {
  MESSAGES_ADD,
  MESSAGES_CLEAR,
  PRIVATE_MESSAGES_CLEAR,
  MESSAGES_CLEAR_LOGPOINT,
  FRONTS_TO_RELEASE_CLEAR,
} = require("devtools/client/webconsole/constants");

function enableActorReleaser(webConsoleUI) {
  return next => (reducer, initialState, enhancer) => {
    function releaseActorsEnhancer(state, action) {
      return reducer(state, action);
    }

    return next(releaseActorsEnhancer, initialState, enhancer);
  };
}

module.exports = enableActorReleaser;
