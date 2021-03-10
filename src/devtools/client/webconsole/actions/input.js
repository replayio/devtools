/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {
  EVALUATE_EXPRESSION,
  SET_TERMINAL_INPUT,
  SET_TERMINAL_EAGER_RESULT,
} = require("devtools/client/webconsole/constants");
const { getAllPrefs } = require("devtools/client/webconsole/selectors/prefs");
const { ThreadFront, createPrimitiveValueFront } = require("protocol/thread");
const { assert } = require("protocol/utils");

const messagesActions = require("devtools/client/webconsole/actions/messages");
const { ConsoleCommand } = require("devtools/client/webconsole/types");

let nextEvalId = 1;
function evaluateExpression(expression) {
  return async ({ dispatch, toolbox }) => {
    if (!expression) {
      const inputSelection = window.jsterm?.editor.getSelection();
      const inputValue = window.jsterm?._getValue();
      expression = inputSelection || inputValue;
    }
    if (!expression) {
      return null;
    }

    const { asyncIndex, frameId } = toolbox.getPanel("debugger").getFrameId();
    const pause = ThreadFront.pauseForAsyncIndex(asyncIndex);
    assert(pause);

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

    // Even if the evaluation fails,
    // we still need to pass the error response to onExpressionEvaluated.
    const onSettled = res => res;

    const response = await evaluateJSAsync(expression, {
      asyncIndex,
      frameId,
      forConsoleMessage: true,
    }).then(onSettled, onSettled);
    response.evalId = evalId;

    return dispatch(onExpressionEvaluated(response));
  };
}

/**
 * Evaluate a JavaScript expression asynchronously.
 *
 * @param {String} string: The code you want to evaluate.
 * @param {Object} options: Options for evaluation. See evaluateJSAsync method on
 *                          devtools/shared/fronts/webconsole.js
 */
async function evaluateJSAsync(expression, options = {}) {
  const { asyncIndex, frameId } = options;
  const rv = await ThreadFront.evaluate(asyncIndex, frameId, expression);
  const { returned, exception, failed } = rv;

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
}

/**
 * The JavaScript evaluation response handler.
 *
 * @private
 * @param {Object} response
 *        The message received from the server.
 */
function onExpressionEvaluated(response) {
  return async ({ dispatch }) => {
    if (response.error) {
      console.error(`Evaluation error`, response.error, ": ", response.message);
      return;
    }

    // If the evaluation was a top-level await expression that was rejected, there will
    // be an uncaught exception reported, so we don't need to do anything.
    if (response.topLevelAwaitRejected === true) {
      return;
    }

    dispatch(messagesActions.messagesAdd([response]));

    return;
  };
}

function setInputValue(value) {
  return () => {
    window.jsterm.setValue(newValue);
  };
}
module.exports = {
  evaluateExpression,
  setInputValue,
};
