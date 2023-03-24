/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// Check whether location A starts after location B
import type {
  ClassOutline,
  FunctionOutline,
  SourceLocation,
  SourceLocationRange,
  getSourceOutlineResult,
} from "@replayio/protocol";

import { sourceOutlineCache } from "replay-next/src/suspense/SourceOutlineCache";
import { UIThunkAction } from "ui/actions";

export function positionAfter(a: SourceLocationRange, b: SourceLocationRange) {
  return (
    a.begin.line > b.begin.line ||
    (a.begin.line === b.begin.line && a.begin.column > b.begin.column)
  );
}

export function containsPosition(a: SourceLocationRange, b: SourceLocation) {
  const bColumn = b.column || 0;
  const startsBefore =
    a.begin.line < b.line || (a.begin.line === b.line && a.begin.column <= bColumn);
  const endsAfter = a.end.line > b.line || (a.end.line === b.line && a.end.column >= bColumn);

  return startsBefore && endsAfter;
}

export function findClosestofSymbol(
  declarations: (FunctionOutline | ClassOutline)[],
  location: SourceLocation
) {
  if (!declarations) {
    return null;
  }

  return declarations.reduce((found, currNode) => {
    // Find a symbol that encloses the location
    if (
      currNode.name === "anonymous" ||
      !containsPosition(currNode.location, {
        line: location.line,
        column: location.column || 0,
      })
    ) {
      return found;
    }

    if (!found) {
      return currNode;
    }

    // If two symbols enclose the location, get the closer symbol
    if (found.location.begin.line > currNode.location.begin.line) {
      return found;
    }
    if (
      found.location.begin.line === currNode.location.begin.line &&
      found.location.begin.column > currNode.location.begin.column
    ) {
      return found;
    }

    return currNode;
  }, null as (FunctionOutline | ClassOutline) | null);
}

export function findClosestFunction(
  symbolsEntry: getSourceOutlineResult | null,
  location: SourceLocation
) {
  if (!symbolsEntry) {
    return null;
  }

  return findClosestofSymbol(symbolsEntry.functions, location);
}

export function findClosestFunctionNameThunk(
  sourceId: string,
  location: SourceLocation
): UIThunkAction<string | null> {
  return (dispatch, getState) => {
    const symbols = sourceOutlineCache.getValueIfCached(null as any, sourceId);

    const closestFunction = symbols ? findClosestFunction(symbols, location) : null;
    return closestFunction?.name ?? null;
  };
}

export function findClosestClass(
  symbolsEntry: getSourceOutlineResult | null,
  location: SourceLocation
) {
  if (!symbolsEntry) {
    return null;
  }

  return findClosestofSymbol(symbolsEntry.classes, location);
}

export function findClosestEnclosedSymbol(
  symbolsEntry: getSourceOutlineResult | null,
  location: SourceLocation
) {
  let classes: ClassOutline[] = [];
  let functions: FunctionOutline[] = [];

  if (symbolsEntry) {
    ({ classes, functions } = symbolsEntry);
  }

  return findClosestofSymbol([...functions, ...classes], location);
}
