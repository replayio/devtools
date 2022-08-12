/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import type { UIState } from "ui/state";
import type { ThreadContext } from "devtools/client/debugger/src/reducers/pause";
import type { AnyAction, Middleware } from "@reduxjs/toolkit";

// TODO This legacy documentation may be outdated with Replay

// Context encapsulates the main parameters of the current redux state, which
// impact most other information tracked by the debugger.
//
// The main use of Context is to control when asynchronous operations are
// allowed to make changes to the program state. Such operations might be
// invalidated as the state changes from the time the operation was originally
// initiated. For example, operations on pause state might still continue even
// after the thread unpauses.
//
// The methods below can be used to compare an old context with the current one
// and see if the operation is now invalid and should be abandoned. Actions can
// also include a 'cx' Context property, which will be checked by the context
// middleware. If the action fails validateContextAction() then it will not be
// dispatched.
//
// Context can additionally be used as a shortcut to access the main properties
// of the pause state.

// A normal Context is invalidated if the target navigates.

// A ThreadContext is invalidated if the target navigates, or if the current
// thread changes, pauses, or resumes.

export class ContextError extends Error {}

// Inline the selector here
function getThreadContext(state: UIState) {
  return state.pause.threadcx;
}

export function validateContext(state: UIState, cx: ThreadContext) {
  const newcx = getThreadContext(state);
  if (cx.pauseCounter && cx.pauseCounter != newcx.pauseCounter) {
    console.warn("Current thread has paused or resumed");
  }
}

function validateActionContext(getState: () => UIState, cx: ThreadContext, action: AnyAction) {
  // Watch for other actions which are unaffected by thread changes.

  try {
    // Validate using all available information in the context.
    validateContext(getState(), cx);
  } catch (e) {
    console.log(`ActionContextFailure ${action.type}`);
    throw e;
  }
}

export const getContextFromAction = (action: AnyAction): ThreadContext | null => {
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
