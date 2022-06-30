/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import { getSelectedFrame } from "devtools/client/debugger/src/selectors";
import * as messagesActions from "devtools/client/webconsole/actions/messages";
import { createPrimitiveValueFront } from "protocol/thread/value";
import { UIThunkAction } from "ui/actions";

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

function dispatchExpression(expression: string): UIThunkAction<Promise<number>> {
  return async (dispatch, getState, { ThreadFront }) => {
    // We use the messages action as it's doing additional transformation on the message.
    const pause = await ThreadFront.ensureCurrentPause();

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
  };
}

export function paywallExpression(expression: string, reason = "team-user"): UIThunkAction {
  return async (dispatch, getState, { ThreadFront }) => {
    const evalId = await dispatch(dispatchExpression(expression));
    const pause = await ThreadFront.ensureCurrentPause();

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
    const evalId = await dispatch(dispatchExpression(expression));

    dispatch(
      messagesActions.messagesAdd([
        {
          type: "evaluationResult",
          result: createPrimitiveValueFront("Loading…"),
          evalId,
        },
      ])
    );

    try {
      const response: EvaluationResponse = await dispatch(
        evaluateJSAsync(expression, {
          forConsoleMessage: true,
        })
      );
      response.evalId = evalId;

      return dispatch(onExpressionEvaluated(response));
    } catch (err: any) {
      let msg = "Error: Evaluation failed";
      if (err.message) {
        msg += ` - ${err.message}`;
      }

      return dispatch(
        onExpressionEvaluated({
          type: "evaluationResult",
          result: createPrimitiveValueFront(msg),
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

    try {
      await dispatch(evaluateJSAsync(expression, { pure: true }));
    } catch (err: any) {
      let msg = "Error: Eager Evaluation failed";
      if (err.message) {
        msg += ` - ${err.message}`;
      }
      console.error(msg);
    }
  };
}

function evaluateJSAsync(
  expression: string,
  options: EvaluateJSAsyncOptions = {}
): UIThunkAction<Promise<EvaluationResponse>> {
  return async (dispatch, getState, { ThreadFront }) => {
    const { pure } = options;

    const selectedFrame = getSelectedFrame(getState());
    const asyncIndex = selectedFrame?.asyncIndex;
    const frameId = selectedFrame?.protocolId;

    // reminder that there would be no results if the function were impure -logan
    const { returned, exception, failed } = await ThreadFront.evaluate({
      asyncIndex,
      frameId,
      text: expression,
      pure,
    });

    let v;
    if (failed || !(returned || exception)) {
      v = createPrimitiveValueFront("Error: Evaluation failed");
    } else if (returned) {
      v = returned;
    } else {
      v = exception;
    }

    return {
      type: "evaluationResult",
      result: v,
    };
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

module.exports = {
  evaluateExpression,
  paywallExpression,
  eagerEvalExpression,
};
