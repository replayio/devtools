/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import type { SourceDetails } from "ui/reducers/sources";
import { SymbolDeclarations } from "../../selectors";
import { findClosestFunction } from "../ast";

export function getASTLocation(source: SourceDetails, symbols: SymbolDeclarations, location) {
  if (!symbols || symbols.loading) {
    return { name: undefined, offset: location, index: 0 };
  }

  const scope = findClosestFunction(symbols, location);
  if (scope) {
    // we only record the line, but at some point we may
    // also do column offsets
    const line = location.line - scope.location.start.line;
    return {
      name: scope.name,
      offset: { line, column: undefined },
      index: scope.index,
    };
  }
  return { name: undefined, offset: location, index: 0 };
}

export function findFunctionByName(symbols: SymbolDeclarations, name: string, index: number) {
  if (symbols.loading) {
    return null;
  }

  return symbols.functions.find(node => node.name === name && node.index === index);
}
