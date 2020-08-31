/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// 

import {
  getSelectedFrame,
  getThreadContext,
  getThreadExecutionPoint,
  getCurrentThread,
  getSource,
  getResumePoint,
  getFramePositions,
} from "../../selectors";
import { PROMISE } from "../utils/middleware/promise";
import { evaluateExpressions } from "../expressions";
import { selectLocation } from "../sources";
import { fetchScopes } from "./fetchScopes";
import { fetchFrames } from "./fetchFrames";
import { recordEvent } from "../../utils/telemetry";
import assert from "../../utils/assert";
import FullStory from "ui/utils/fullstory";

import { generateInlinePreview } from "./inlinePreview";
import { setFramePositions } from "./setFramePositions";



const { log } = require("protocol/socket");
const { ThreadFront } = require("protocol/thread");

export function selectThread(cx, thread) {
  return async ({ dispatch, getState, client }) => {
    await dispatch({ cx, type: "SELECT_THREAD", thread });

    // Get a new context now that the current thread has changed.
    const threadcx = getThreadContext(getState());
    assert(threadcx.thread == thread, "Thread mismatch");

    const serverRequests = [];
    serverRequests.push(dispatch(evaluateExpressions(threadcx)));

    const frame = getSelectedFrame(getState(), thread);
    if (frame) {
      serverRequests.push(dispatch(selectLocation(threadcx, frame.location)));
      serverRequests.push(dispatch(fetchFrames(threadcx)));
      serverRequests.push(dispatch(fetchScopes(threadcx)));
    }
    await Promise.all(serverRequests);
  };
}

/**
 * Debugger commands like stepOver, stepIn, stepUp
 *
 * @param string $0.type
 * @memberof actions/pause
 * @static
 */
export function command(cx, type, executionPoint) {
  return async (thunkArgs) => {
    const { dispatch, getState, client } = thunkArgs;
    log(`Debugger CommandStart ${type}`);
    FullStory.event(`debugger.${type}`);

    const thread = getCurrentThread(getState());
    const point = getThreadExecutionPoint(getState(), thread);

    if (!type) {
      return;
    }
    if (!getFramePositions(getState(), thread)) {
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
      thread: cx.thread,
      [PROMISE]: client[type](cx.thread, nextPoint),
    });
  };
}

export function seekToPosition(point, time) {
  return ({ dispatch, getState, client }) => {
    const cx = getThreadContext(getState());
    ThreadFront.timeWarp(point, time, /* hasFrames */ true);
  };
}

/**
 * StepIn
 * @memberof actions/pause
 * @static
 * @returns {Function} {@link command}
 */
export function stepIn(cx) {
  return ({ dispatch, getState }) => {
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
  return ({ dispatch, getState }) => {
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
  return ({ dispatch, getState }) => {
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
  return ({ dispatch, getState }) => {
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
  return ({ dispatch, getState }) => {
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
  return ({ dispatch, getState }) => {
    if (cx.isPaused) {
      return dispatch(command(cx, "reverseStepOver"));
    }
  };
}
