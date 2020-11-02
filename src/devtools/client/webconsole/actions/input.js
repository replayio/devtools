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

const messagesActions = require("devtools/client/webconsole/actions/messages");
const { ConsoleCommand } = require("devtools/client/webconsole/types");

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

    // We use the messages action as it's doing additional transformation on the message.
    dispatch(
      messagesActions.messagesAdd([
        new ConsoleCommand({
          messageText: expression,
          timeStamp: Date.now(),
        }),
      ])
    );
    dispatch({ type: EVALUATE_EXPRESSION, expression });

    const frameActor = toolbox.getPanel("debugger").getFrameId();

    // Even if the evaluation fails,
    // we still need to pass the error response to onExpressionEvaluated.
    const onSettled = res => res;

    const response = await evaluateJSAsync(expression, {
      frameActor,
      forConsoleMessage: true,
    }).then(onSettled, onSettled);

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
  const { frameActor } = options;
  const rv = await ThreadFront.evaluate(/* asyncIndex */ 0, frameActor, expression);
  const { returned, exception, failed } = rv;

  let v;
  if (failed) {
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
    window.jsterm?._setValue(newValue);
  };
}

function terminalInputChanged(expression) {
  return async ({ getState }) => {
    const prefs = getAllPrefs(getState());
    if (!prefs.eagerEvaluation) {
      return;
    }

    // FIXME Eager evaluation is NYI
    return;
    /*
    const { terminalInput = "" } = getState().history;
    // Only re-evaluate if the expression did change.
    if (
      (!terminalInput && !expression) ||
      (typeof terminalInput === "string" &&
        typeof expression === "string" &&
        expression.trim() === terminalInput.trim())
    ) {
      return;
    }

    dispatch({
      type: SET_TERMINAL_INPUT,
      expression: expression.trim(),
    });

    // There's no need to evaluate an empty string.
    if (!expression || !expression.trim()) {
      // eslint-disable-next-line consistent-return
      return dispatch({
        type: SET_TERMINAL_EAGER_RESULT,
        expression,
        result: null,
      });
    }

    let mapped;
    ({ expression, mapped } = await getMappedExpression(expression));

    const frameActor = toolbox.getPanel("debugger").getFrameId();
    const selectedThreadFront = toolbox?.getSelectedThreadFront();

    const response = await client.evaluateJSAsync(expression, {
      frameActor,
      selectedThreadFront,
      mapped,
      eager: true,
    });

    // eslint-disable-next-line consistent-return
    return dispatch({
      type: SET_TERMINAL_EAGER_RESULT,
      result: getEagerEvaluationResult(response),
    });
    */
  };
}

function getEagerEvaluationResult(response) {
  const result = response.exception || response.result;
  // Don't show syntax errors results to the user.
  if ((result && result.isSyntaxError) || (result && result.type == "undefined")) {
    return null;
  }

  return result;
}

module.exports = {
  evaluateExpression,
  setInputValue,
  terminalInputChanged,
};
