/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import type { UIState } from "ui/state";
import type { Context } from "devtools/client/debugger/src/reducers/pause";
import type { AnyAction, Middleware } from "@reduxjs/toolkit";

import { validateContext } from "devtools/client/debugger/src/utils/context";

function validateActionContext(getState: () => UIState, cx: Context, action: AnyAction) {
  // Watch for other actions which are unaffected by thread changes.

  try {
    // Validate using all available information in the context.
    validateContext(getState(), cx);
  } catch (e) {
    console.log(`ActionContextFailure ${action.type}`);
    throw e;
  }
}

export const getContextFromAction = (action: AnyAction): Context | null => {
  return action.cx ?? action.meta?.cx ?? action.payload?.cx ?? action?.meta?.arg?.cx ?? null;
};

// Middleware which looks for actions that have a cx property and ignores
// them if the context is no longer valid.
export const context: Middleware = storeApi => {
  return next => action => {
    const cx = getContextFromAction(action);
    if (cx) {
      validateActionContext(storeApi.getState, cx, action);
    }

    return next(action);
  };
};
