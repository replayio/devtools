/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { ThreadContext, ValidCommand } from "devtools/client/debugger/src/reducers/pause";
import { executeCommandOperation } from "devtools/client/debugger/src/reducers/pause";
import type { UIThunkAction } from "ui/actions";

export function command(cx: ThreadContext, type: ValidCommand): UIThunkAction {
  return async dispatch => {
    if (!type) {
      return;
    }
    await dispatch(executeCommandOperation({ cx, command: type }));
  };
}

export function stepIn(cx: ThreadContext): UIThunkAction {
  return dispatch => {
    if (cx.isPaused) {
      return dispatch(command(cx, "stepIn"));
    }
  };
}

export function stepOver(cx: ThreadContext): UIThunkAction {
  return dispatch => {
    if (cx.isPaused) {
      return dispatch(command(cx, "stepOver"));
    }
  };
}

export function reverseStepOver(cx: ThreadContext): UIThunkAction {
  return dispatch => {
    if (cx.isPaused) {
      return dispatch(command(cx, "reverseStepOver"));
    }
  };
}

export function stepOut(cx: ThreadContext): UIThunkAction {
  return dispatch => {
    if (cx.isPaused) {
      return dispatch(command(cx, "stepOut"));
    }
  };
}

export function resume(cx: ThreadContext): UIThunkAction {
  return dispatch => dispatch(command(cx, "resume"));
}

export function rewind(cx: ThreadContext): UIThunkAction {
  return dispatch => dispatch(command(cx, "rewind"));
}
