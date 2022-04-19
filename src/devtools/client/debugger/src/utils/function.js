/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import { score as fuzzaldrinScore } from "fuzzaldrin-plus";

import { findClosestFunction } from "./ast";
import { isFulfilled } from "./async-value";
import { correctIndentation } from "./indentation";

export function findFunctionText(line, source, symbols) {
  const func = findClosestFunction(symbols, {
    column: Infinity,
    line,
    sourceId: source.id,
  });

  if (
    !func ||
    !source.content ||
    !isFulfilled(source.content) ||
    source.content.value.type !== "text"
  ) {
    return null;
  }

  const {
    location: { start, end },
  } = func;
  const lines = source.content.value.value.split("\n");
  const firstLine = lines[start.line - 1].slice(start.column);
  const lastLine = lines[end.line - 1].slice(0, end.column);
  const middle = lines.slice(start.line, end.line - 1);
  const functionText = [firstLine, ...middle, lastLine].join("\n");
  const indentedFunctionText = correctIndentation(functionText);

  return indentedFunctionText;
}

/**
 * Check whether the name argument matches the fuzzy filter argument
 */
export const fuzzySearch = (name, filter) => {
  // Set higher to make the fuzzaldrin filter more specific
  const FUZZALDRIN_FILTER_THRESHOLD = 15000;
  if (!filter) {
    return true;
  }

  if (filter.length === 1) {
    // when filter is a single char just check if it starts with the char
    return filter.toLowerCase() === name.toLowerCase()[0];
  }
  return fuzzaldrinScore(name, filter) > FUZZALDRIN_FILTER_THRESHOLD;
};
