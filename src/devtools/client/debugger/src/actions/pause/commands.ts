/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { UIThunkAction } from "ui/actions";
import type { Context } from "devtools/client/debugger/src/reducers/pause";

import { getResumePoint, getFramePositions } from "../../selectors";
import { getLoadedRegions } from "ui/reducers/app";
import { PROMISE } from "ui/setup/redux/middleware/promise";

import { setFramePositions } from "./setFramePositions";

type ValidCommand = "stepIn" | "stepOut" | "stepOver" | "resume" | "rewind" | "reverseStepOver";

export function command(cx: Context, type: ValidCommand): UIThunkAction {
  return async (dispatch, getState, { client }) => {
    if (!type) {
      return;
    }
    if (!getFramePositions(getState())) {
      await dispatch(setFramePositions());
    }
    const nextPoint = getResumePoint(getState(), type)!;
    if (type == "resume" || type == "rewind") {
      dispatch({ type: "CLEAR_FRAME_POSITIONS" });
    }
    return dispatch({
      type: "COMMAND",
      command: type,
      cx,
      [PROMISE]: client[type](nextPoint, getLoadedRegions(getState())!),
    });
  };
}

export function stepIn(cx: Context): UIThunkAction {
  return dispatch => {
    if (cx.isPaused) {
      return dispatch(command(cx, "stepIn"));
    }
  };
}

export function stepOver(cx: Context): UIThunkAction {
  return dispatch => {
    if (cx.isPaused) {
      return dispatch(command(cx, "stepOver"));
    }
  };
}

export function reverseStepOver(cx: Context): UIThunkAction {
  return dispatch => {
    if (cx.isPaused) {
      return dispatch(command(cx, "reverseStepOver"));
    }
  };
}

export function stepOut(cx: Context): UIThunkAction {
  return dispatch => {
    if (cx.isPaused) {
      return dispatch(command(cx, "stepOut"));
    }
  };
}

export function resume(cx: Context): UIThunkAction {
  return dispatch => dispatch(command(cx, "resume"));
}

export function rewind(cx: Context): UIThunkAction {
  return dispatch => dispatch(command(cx, "rewind"));
}
