/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import {
  getExpression,
  getExpressions,
  getSelectedFrame,
  getSelectedFrameId,
  getFrames,
  getSourceFromId,
  getSelectedSource,
  getCurrentThread,
  getIsPaused,
} from "../selectors";
import { PROMISE } from "./utils/middleware/promise";
import { wrapExpression } from "../utils/expressions";
import { features } from "../utils/prefs";

/**
 * Add expression for debugger to watch
 *
 * @param {object} expression
 * @param {number} expression.id
 * @memberof actions/pause
 * @static
 */
export function addExpression(cx, input) {
  return async ({ dispatch, getState, evaluationsParser }) => {
    if (!input) {
      return;
    }

    const expressionError = await evaluationsParser.hasSyntaxError(input);

    const expression = getExpression(getState(), input);
    if (expression) {
      return dispatch(evaluateExpression(cx, expression));
    }

    dispatch({ type: "ADD_EXPRESSION", cx, input, expressionError });

    const newExpression = getExpression(getState(), input);
    if (newExpression) {
      return dispatch(evaluateExpression(cx, newExpression));
    }
  };
}

export function autocomplete(cx, input, cursor) {
  return async ({ dispatch, getState, client }) => {
    if (!input) {
      return;
    }
    const frameId = getSelectedFrameId(getState(), cx.thread);
    const result = await client.autocomplete(input, cursor, frameId);
    await dispatch({ type: "AUTOCOMPLETE", cx, input, result });
  };
}

export function clearAutocomplete() {
  return { type: "CLEAR_AUTOCOMPLETE" };
}

export function clearExpressionError() {
  return { type: "CLEAR_EXPRESSION_ERROR" };
}

export function updateExpression(cx, input, expression) {
  return async ({ dispatch, getState, parser }) => {
    if (!input) {
      return;
    }

    const expressionError = await parser.hasSyntaxError(input);
    dispatch({
      type: "UPDATE_EXPRESSION",
      cx,
      expression,
      input: expressionError ? expression.input : input,
      expressionError,
    });

    dispatch(evaluateExpressions(cx));
  };
}

/**
 *
 * @param {object} expression
 * @param {number} expression.id
 * @memberof actions/pause
 * @static
 */
export function deleteExpression(expression) {
  return ({ dispatch }) => {
    dispatch({
      type: "DELETE_EXPRESSION",
      input: expression.input,
    });
  };
}

function getEvaluateOptions(cx, state) {
  const frameId = getSelectedFrameId(state, cx.thread);
  if (!frameId) {
    return { thread: cx.thread };
  }

  const frames = getFrames(state, cx.thread);
  const frame = frames.find(f => f.id == frameId);

  return {
    asyncIndex: frame.asyncIndex,
    frameId: frame.protocolId,
    thread: cx.thread,
  };
}

/**
 *
 * @memberof actions/pause
 * @param {number} selectedFrameId
 * @static
 */
export function evaluateExpressions(cx) {
  return async function ({ dispatch, getState, client }) {
    const expressions = getExpressions(getState());
    const inputs = expressions.map(({ input }) => input);

    const options = getEvaluateOptions(cx, getState());
    const results = await client.evaluateExpressions(inputs, options);
    dispatch({ type: "EVALUATE_EXPRESSIONS", cx, inputs, results });
  };
}

export function markEvaluatedExpressionsAsLoading(cx) {
  return async function ({ dispatch, getState, client }) {
    const expressions = getExpressions(getState());
    const inputs = expressions.map(({ input }) => input);
    const results = inputs.map(() => null);
    dispatch({ type: "EVALUATE_EXPRESSIONS", cx, inputs, results });
  };
}

function evaluateExpression(cx, expression) {
  return async function ({ dispatch, getState, client, sourceMaps }) {
    if (!expression.input) {
      console.warn("Expressions should not be empty");
      return;
    }

    let input = expression.input;
    const options = getEvaluateOptions(cx, getState());

    return dispatch({
      type: "EVALUATE_EXPRESSION",
      cx,
      thread: cx.thread,
      input: expression.input,
      [PROMISE]: client.evaluate(wrapExpression(input), options),
    });
  };
}
