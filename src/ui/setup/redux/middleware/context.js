/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { validateContext } from "devtools/client/debugger/src/utils/context";

const { log } = require("protocol/socket");

function validateActionContext(getState, action) {
  // Watch for other actions which are unaffected by thread changes.

  try {
    // Validate using all available information in the context.
    validateContext(getState(), action.cx);
  } catch (e) {
    console.log(`ActionContextFailure ${action.type}`);
    throw e;
  }
}

function actionLogData(action) {
  switch (action.type) {
    case "COMMAND":
      return " " + action.command;
    case "PAUSED":
      return " " + JSON.stringify(action.executionPoint);
  }
  return "";
}

function logAction(action) {
  const data = actionLogData(action);
  const status = action.status ? ` [${action.status}]` : "";
  log(`Debugger ${action.type}${data}${status}`);
}

// Middleware which looks for actions that have a cx property and ignores
// them if the context is no longer valid.
function context(storeApi) {
  return next => action => {
    if ("cx" in action) {
      validateActionContext(storeApi.getState, action);
    }

    logAction(action);

    return next(action);
  };
}

export { context };
