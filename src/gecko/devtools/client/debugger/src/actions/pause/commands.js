/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// @flow

import {
  getSelectedFrame,
  getThreadContext,
  getThreadExecutionPoint,
  getCurrentThread,
  getSource,
} from "../../selectors";
import { PROMISE } from "../utils/middleware/promise";
import { evaluateExpressions } from "../expressions";
import { selectLocation } from "../sources";
import { fetchScopes } from "./fetchScopes";
import { fetchFrames } from "./fetchFrames";
import { recordEvent } from "../../utils/telemetry";
import assert from "../../utils/assert";

import { generateInlinePreview } from "./inlinePreview";
import { setFramePositions } from "./setFramePositions";

import type { ThreadId, Context, ThreadContext, ExecutionPoint } from "../../types";

import type { ThunkArgs } from "../types";
import type { Command } from "../../reducers/types";

const { log } = require("protocol/socket");

export function selectThread(cx: Context, thread: ThreadId) {
  return async ({ dispatch, getState, client }: ThunkArgs) => {
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
export function command(cx: ThreadContext, type: Command) {
  return async (thunkArgs: ThunkArgs) => {
    const { dispatch, getState, client } = thunkArgs;
    log(`Debugger CommandStart ${type}`);

    const thread = getCurrentThread(getState());
    const point = getThreadExecutionPoint(getState(), thread);

    const instantInfo = client.eventMethods.canInstantStep(point, type);
    if (instantInfo) {
      return doInstantStep(thunkArgs, instantInfo);
    }

    if (type) {
      if (type == "resume" || type == "rewind") {
        dispatch({ type: "CLEAR_FRAME_POSITIONS" });
      }
      return dispatch({
        type: "COMMAND",
        command: type,
        cx,
        thread: cx.thread,
        [PROMISE]: client[type](cx.thread),
      });
    }
  };
}

async function doInstantStep({ dispatch, getState, client }, instantInfo) {
  ChromeUtils.recordReplayLog(`Debugger InstantStep`);

  const why = { type: "replayForcedPause" };
  const { executionPoint, frames, environment } = instantInfo;
  client.instantWarp(executionPoint);

  const thread = getCurrentThread(getState());

  const updates = [];
  const batch = { type: "BATCH", updates };

  updates.push({ type: "RESUME", thread, wasStepping: true });
  updates.push({ type: "PAUSED", thread, why, executionPoint });

  const frame = frames[0];
  updates.push({ type: "FETCHED_FRAMES", thread, frames });

  updates.push({
    type: "ADD_SCOPES",
    thread,
    frame,
    status: "done",
    value: environment,
  });

  const source = getSource(getState(), frame.location.sourceId);
  if (source) {
    updates.push({
      type: "SET_SELECTED_LOCATION",
      source,
      location: frame.location,
    });
  }

  dispatch(batch);

  const cx = getThreadContext(getState());

  dispatch(setFramePositions());

  dispatch(generateInlinePreview(cx, frame.id, frame.location));
  await dispatch(evaluateExpressions(cx));
}

export function seekToPosition(point: ExecutionPoint, time) {
  return ({ dispatch, getState, client }: ThunkArgs) => {
    const cx = getThreadContext(getState());
    client.timeWarp(point, time);
  };
}

/**
 * StepIn
 * @memberof actions/pause
 * @static
 * @returns {Function} {@link command}
 */
export function stepIn(cx: ThreadContext) {
  return ({ dispatch, getState }: ThunkArgs) => {
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
export function stepOver(cx: ThreadContext) {
  return ({ dispatch, getState }: ThunkArgs) => {
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
export function stepOut(cx: ThreadContext) {
  return ({ dispatch, getState }: ThunkArgs) => {
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
export function resume(cx: ThreadContext) {
  return ({ dispatch, getState }: ThunkArgs) => {
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
export function rewind(cx: ThreadContext) {
  return ({ dispatch, getState }: ThunkArgs) => {
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
export function reverseStepOver(cx: ThreadContext) {
  return ({ dispatch, getState }: ThunkArgs) => {
    if (cx.isPaused) {
      return dispatch(command(cx, "reverseStepOver"));
    }
  };
}
