/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { getResumePoint, getFramePositions } from "../../selectors";
import { getLoadedRegions } from "ui/reducers/app";
import { PROMISE } from "ui/setup/redux/middleware/promise";

import { setFramePositions } from "./setFramePositions";

export function command(cx, type) {
  return async (dispatch, getState, { client }) => {
    if (!type) {
      return;
    }
    if (!getFramePositions(getState())) {
      await dispatch(setFramePositions());
    }
    const nextPoint = getResumePoint(getState(), type);
    if (type == "resume" || type == "rewind") {
      dispatch({ type: "CLEAR_FRAME_POSITIONS" });
    }
    return dispatch({
      type: "COMMAND",
      command: type,
      cx,
      [PROMISE]: client[type](nextPoint, getLoadedRegions(getState())),
    });
  };
}

export function stepIn(cx) {
  return dispatch => {
    if (cx.isPaused) {
      return dispatch(command(cx, "stepIn"));
    }
  };
}

export function stepOver(cx) {
  return dispatch => {
    if (cx.isPaused) {
      return dispatch(command(cx, "stepOver"));
    }
  };
}

export function reverseStepOver(cx) {
  return dispatch => {
    if (cx.isPaused) {
      return dispatch(command(cx, "reverseStepOver"));
    }
  };
}

export function stepOut(cx) {
  return dispatch => {
    if (cx.isPaused) {
      return dispatch(command(cx, "stepOut"));
    }
  };
}

export function resume(cx) {
  return dispatch => dispatch(command(cx, "resume"));
}

export function rewind(cx) {
  return dispatch => dispatch(command(cx, "rewind"));
}
