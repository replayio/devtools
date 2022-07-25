/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import { TerminalExpression } from "@bvaughn/src/contexts/TerminalContext";
import { getSelectedFrame } from "devtools/client/debugger/src/selectors";
import * as messagesActions from "devtools/client/webconsole/actions/messages";
import type { ThreadFront as ThreadFrontType } from "protocol/thread";
import { Pause } from "protocol/thread/pause";
import { createPrimitiveValueFront } from "protocol/thread/value";
import type { ThunkDispatch } from "redux-thunk";
import { UIAction, UIThunkAction } from "ui/actions";
import { UIState } from "ui/state";
import { ThunkExtraArgs } from "ui/utils/thunk";

const { EVALUATE_EXPRESSION } = require("devtools/client/webconsole/constants");
const { MESSAGE_SOURCE } = require("devtools/client/webconsole/constants");
const { ConsoleCommand, PaywallMessage } = require("devtools/client/webconsole/types");

type EvaluateJSAsyncOptions = {
  asyncIndex?: number;
  pure?: boolean;
  forConsoleMessage?: boolean;
  frameId?: string;
};
type EvaluationResponse = {
  type: string;
  result: EvaluationResponseResult;
  evalId?: number;
  topLevelAwaitRejected?: boolean;
};
type EvaluationResponseResult = any;

export type EvaluationEventPayload = Omit<TerminalExpression, "type">;

async function dispatchExpression(
  dispatch: ThunkDispatch<UIState, ThunkExtraArgs, UIAction>,
  pause: Pause,
  expression: string
) {
  // We use the messages action as it's doing additional transformation on the message.
  let evalId = nextEvalId++;
  dispatch(
    messagesActions.messagesAdd([
      new ConsoleCommand({
        messageText: expression,
        timeStamp: Date.now(),
        evalId,
        executionPoint: pause.point,
        executionPointTime: pause.time,
      }),
    ])
  );
  dispatch({ type: EVALUATE_EXPRESSION, expression });

  return evalId;
}

export function paywallExpression(expression: string, reason = "team-user"): UIThunkAction {
  return async (dispatch, getState, { ThreadFront }) => {
    const selectedFrame = getSelectedFrame(getState());
    const asyncIndex = selectedFrame?.asyncIndex;

    const pause = await ThreadFront.pauseForAsyncIndex(asyncIndex);
    const evalId = await dispatchExpression(dispatch, pause!, expression);

    dispatch(
      messagesActions.messagesAdd([
        new PaywallMessage({
          paywall: {
            reason,
          },
          source: MESSAGE_SOURCE.CONSOLE_API,
          timeStamp: Date.now(),
          evalId,
          executionPoint: pause!.point,
          executionPointTime: pause!.time,
        }),
      ])
    );
  };
}

let nextEvalId = 1;
export function evaluateExpression(expression: string): UIThunkAction {
  return async (dispatch, getState, { ThreadFront }) => {
    if (!expression) {
      expression = window.jsterm?.editor.getSelection();
    }
    if (!expression) {
      return null;
    }

    const selectedFrame = getSelectedFrame(getState());
    const asyncIndex = selectedFrame?.asyncIndex;
    const frameId = selectedFrame?.protocolId;

    const pause = await ThreadFront.pauseForAsyncIndex(asyncIndex);
    const evalId = await dispatchExpression(dispatch, pause!, expression);

    dispatch(
      messagesActions.messagesAdd([
        {
          type: "evaluationResult",
          result: createPrimitiveValueFront("Loading…", pause),
          evalId,
        },
      ])
    );

    try {
      const response: EvaluationResponse = await evaluateJSAsync(expression, ThreadFront, {
        asyncIndex,
        frameId,
        forConsoleMessage: true,
      });
      response.evalId = evalId;

      // This block of code connects the old JSTerm component and its Redux state
      // to the new Console which reads data from React Context and Suspense.
      // This is a temporary bridge between the old and new code.
      const data: EvaluationEventPayload = {
        expression,
        frameId: frameId || null,
        id: evalId,
        point: pause.point!,
        pauseId: pause.pauseId!,
        time: pause.time!,
      };
      ThreadFront.emit("evaluation", data);

      return dispatch(onExpressionEvaluated(response));
    } catch (err: any) {
      let msg = "Error: Evaluation failed";
      if (err.message) {
        msg += ` - ${err.message}`;
      }

      return dispatch(
        onExpressionEvaluated({
          type: "evaluationResult",
          result: createPrimitiveValueFront(msg, pause),
          evalId,
        })
      );
    }
  };
}

export function eagerEvalExpression(expression: string): UIThunkAction {
  return async (dispatch, getState, { ThreadFront }) => {
    if (!expression) {
      return null;
    }

    const selectedFrame = getSelectedFrame(getState());
    const asyncIndex = selectedFrame?.asyncIndex;
    const frameId = selectedFrame?.protocolId;

    try {
      const response = await evaluateJSAsync(expression, ThreadFront, {
        asyncIndex: asyncIndex!,
        frameId,
        pure: true,
      });
    } catch (err: any) {
      let msg = "Error: Eager Evaluation failed";
      if (err.message) {
        msg += ` - ${err.message}`;
      }
      console.error(msg);
    }
  };
}

/**
 * Evaluate a JavaScript expression asynchronously.
 *
 * @param {String} string: The code you want to evaluate.
 * @param {Object} options: Options for evaluation. See evaluateJSAsync method on
 *                          devtools/shared/fronts/webconsole.js
 */
async function evaluateJSAsync(
  expression: string,
  ThreadFront: typeof ThreadFrontType,
  options: EvaluateJSAsyncOptions = {}
) {
  const { asyncIndex, frameId, pure } = options;
  //reminder that there would be no results if the function were impure -logan
  const { returned, exception, failed } = await ThreadFront.evaluate({
    asyncIndex: asyncIndex!,
    frameId,
    text: expression,
    pure,
  });

  let v;
  if (failed || !(returned || exception)) {
    v = createPrimitiveValueFront(
      "Error: Evaluation failed",
      await ThreadFront.pauseForAsyncIndex(asyncIndex!)
    );
  } else if (returned) {
    v = returned;
  } else {
    v = exception;
  }

  return {
    type: "evaluationResult",
    result: v,
  };
}

/**
 * The JavaScript evaluation response handler.
 *
 * @private
 * @param {Object} response
 *        The message received from the server.
 */
function onExpressionEvaluated(response: EvaluationResponse): UIThunkAction {
  return async dispatch => {
    // If the evaluation was a top-level await expression that was rejected, there will
    // be an uncaught exception reported, so we don't need to do anything.
    if (response.topLevelAwaitRejected === true) {
      return;
    }

    dispatch(messagesActions.messagesAdd([response]));

    return;
  };
}
