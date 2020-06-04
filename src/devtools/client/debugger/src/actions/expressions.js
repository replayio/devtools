/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// @flow

import {
  getExpression,
  getExpressions,
  getSelectedFrame,
  getSelectedFrameId,
  getSourceFromId,
  getSelectedSource,
  getSelectedScopeMappings,
  getSelectedFrameBindings,
  getCurrentThread,
  getIsPaused,
} from "../selectors";
import { PROMISE } from "./utils/middleware/promise";
import { wrapExpression } from "../utils/expressions";
import { features } from "../utils/prefs";

import type { Expression, ThreadContext } from "../types";
import type { ThunkArgs } from "./types";

/**
 * Add expression for debugger to watch
 *
 * @param {object} expression
 * @param {number} expression.id
 * @memberof actions/pause
 * @static
 */
export function addExpression(cx: ThreadContext, input: string) {
  return async ({ dispatch, getState, evaluationsParser }: ThunkArgs) => {
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

export function autocomplete(cx: ThreadContext, input: string, cursor: number) {
  return async ({ dispatch, getState, client }: ThunkArgs) => {
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

export function updateExpression(
  cx: ThreadContext,
  input: string,
  expression: Expression
) {
  return async ({ dispatch, getState, parser }: ThunkArgs) => {
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
export function deleteExpression(expression: Expression) {
  return ({ dispatch }: ThunkArgs) => {
    dispatch({
      type: "DELETE_EXPRESSION",
      input: expression.input,
    });
  };
}

/**
 *
 * @memberof actions/pause
 * @param {number} selectedFrameId
 * @static
 */
export function evaluateExpressions(cx: ThreadContext) {
  return async function ({ dispatch, getState, client }: ThunkArgs) {
    const expressions = getExpressions(getState());
    const inputs = expressions.map(({ input }) => input);
    const frameId = getSelectedFrameId(getState(), cx.thread);
    const results = await client.evaluateExpressions(inputs, {
      frameId,
      thread: cx.thread,
    });
    dispatch({ type: "EVALUATE_EXPRESSIONS", cx, inputs, results });
  };
}

export function markEvaluatedExpressionsAsLoading(cx: ThreadContext) {
  return async function ({ dispatch, getState, client }: ThunkArgs) {
    const expressions = getExpressions(getState());
    const inputs = expressions.map(({ input }) => input);
    const results = inputs.map(() => null);
    dispatch({ type: "EVALUATE_EXPRESSIONS", cx, inputs, results });
  };
}

function evaluateExpression(cx: ThreadContext, expression: Expression) {
  return async function ({ dispatch, getState, client, sourceMaps }: ThunkArgs) {
    if (!expression.input) {
      console.warn("Expressions should not be empty");
      return;
    }

    let input = expression.input;
    const frameId = getSelectedFrameId(getState(), cx.thread);

    return dispatch({
      type: "EVALUATE_EXPRESSION",
      cx,
      thread: cx.thread,
      input: expression.input,
      [PROMISE]: client.evaluate(wrapExpression(input), {
        frameId,
        thread: cx.thread,
      }),
    });
  };
}
