/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { correctIndentation } from "./indentation";

const { createUnavailableValueFront } = require("protocol/thread");

const UNAVAILABLE_GRIP = createUnavailableValueFront();

/*
 * wrap the expression input in a try/catch so that it can be safely
 * evaluated.
 *
 * NOTE: we add line after the expression to protect against comments.
 */
export function wrapExpression(input) {
  return correctIndentation(`
    try {
      ${input}
    } catch (e) {
      e
    }
  `);
}

function isUnavailable(value) {
  if (!value.preview || !value.preview.name) {
    return false;
  }

  return ["ReferenceError", "TypeError"].includes(value.preview.name);
}

export function getValue(expression) {
  const { value, exception, error } = expression;

  if (error) {
    return error;
  }

  if (!value) {
    return UNAVAILABLE_GRIP;
  }

  if (exception) {
    if (isUnavailable(exception)) {
      return UNAVAILABLE_GRIP;
    }
    return exception;
  }

  return value.exception || value.result;
}
