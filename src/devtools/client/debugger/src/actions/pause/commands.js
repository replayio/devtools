/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { getLoadedRegions } from "ui/reducers/app";
import { PROMISE } from "ui/setup/redux/middleware/promise";

import { getExecutionPoint, getResumePoint, getFramePositions } from "../../selectors";
import { recordEvent } from "../../utils/telemetry";

import { setFramePositions } from "./setFramePositions";

const { log } = require("protocol/socket");

/**
 * Debugger commands like stepOver, stepIn, stepUp
 *
 * @param string $0.type
 * @memberof actions/pause
 * @static
 */
export function command(cx, type) {
  return async (dispatch, getState, { client }) => {
    log(`Debugger CommandStart ${type}`);

    const point = getExecutionPoint(getState());

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
      [PROMISE]: client[type](nextPoint, getLoadedRegions(getState())),
      command: type,
      cx,
      type: "COMMAND",
    });
  };
}

/**
 * StepIn
 * @memberof actions/pause
 * @static
 * @returns {Function} {@link command}
 */
export function stepIn(cx) {
  return dispatch => {
    if (cx.isPaused) {
      return dispatch(command(cx, "stepIn"));
    }
  };
}

/**
 * stepOver
 * @memberof actions/pause
 * @static
 * @returns {Function} {@link command}
 */
export function stepOver(cx) {
  return dispatch => {
    if (cx.isPaused) {
      return dispatch(command(cx, "stepOver"));
    }
  };
}

/**
 * stepOut
 * @memberof actions/pause
 * @static
 * @returns {Function} {@link command}
 */
export function stepOut(cx) {
  return dispatch => {
    if (cx.isPaused) {
      return dispatch(command(cx, "stepOut"));
    }
  };
}

/**
 * resume
 * @memberof actions/pause
 * @static
 * @returns {Function} {@link command}
 */
export function resume(cx) {
  return dispatch => {
    if (cx.isPaused) {
      recordEvent("continue");
      return dispatch(command(cx, "resume"));
    }
  };
}

/**
 * rewind
 * @memberof actions/pause
 * @static
 * @returns {Function} {@link command}
 */
export function rewind(cx) {
  return dispatch => {
    if (cx.isPaused) {
      return dispatch(command(cx, "rewind"));
    }
  };
}

/**
 * reverseStepOver
 * @memberof actions/pause
 * @static
 * @returns {Function} {@link command}
 */
export function reverseStepOver(cx) {
  return dispatch => {
    if (cx.isPaused) {
      return dispatch(command(cx, "reverseStepOver"));
    }
  };
}
