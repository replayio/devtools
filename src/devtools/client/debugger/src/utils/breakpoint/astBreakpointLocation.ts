/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { SourceLocation } from "@replayio/protocol";
import type { SourceDetails } from "ui/reducers/sources";
import { findClosestFunction } from "../ast";
import { type SymbolEntry, type FunctionDeclaration } from "../../reducers/ast";
import { LoadingStatus } from "ui/utils/LoadingStatus";

export function getASTLocation(symbols: SymbolEntry | null, location: SourceLocation) {
  if (!symbols || symbols.status !== LoadingStatus.LOADED) {
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
      index: (scope as FunctionDeclaration).index,
    };
  }
  return { name: undefined, offset: location, index: 0 };
}

export function findFunctionByName(symbols: SymbolEntry, name: string) {
  if (symbols.status !== LoadingStatus.LOADED || !name) {
    return null;
  }

  return symbols.symbols!.functions!.find(node => node.name === name);
}
