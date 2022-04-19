/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { getSymbols } from "devtools/client/debugger/src/workers/parser/getSymbols";
import {
  populateSource,
  populateOriginalSource,
} from "devtools/client/debugger/src/workers/parser/tests/helpers";
import cases from "jest-in-case";

import { getASTLocation } from "./astBreakpointLocation.js";

async function setup({ file, location, functionName, original }) {
  const source = original ? populateOriginalSource(file) : populateSource(file);

  const symbols = getSymbols(source.id);

  const astLocation = getASTLocation(source, symbols, location);
  expect(astLocation.name).toBe(functionName);
  expect(astLocation).toMatchSnapshot();
}

describe("ast", () => {
  cases("valid location", setup, [
    {
      file: "math",
      functionName: "math",
      location: { column: 0, line: 6 },
      name: "returns the scope and offset",
    },
    {
      file: "outOfScope",
      functionName: "outer",
      location: { column: 0, line: 25 },
      name: "returns name for a nested anon fn as the parent func",
    },
    {
      file: "outOfScope",
      functionName: "inner",
      location: { column: 0, line: 5 },
      name: "returns name for a nested named fn",
    },
    {
      file: "outOfScope",
      functionName: "globalDeclaration",
      location: { column: 0, line: 40 },
      name: "returns name for an anon fn with a named variable",
    },
  ]);

  cases("invalid location", setup, [
    {
      file: "class",
      functionName: undefined,
      location: { column: 0, line: 10 },
      name: "returns the scope name for global scope as undefined",
      original: true,
    },
    {
      file: "outOfScope",
      functionName: undefined,
      location: { column: 0, line: 44 },
      name: "returns name for an anon fn in global scope as undefined",
    },
  ]);
});
