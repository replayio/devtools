/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// Check whether location A starts after location B
export function positionAfter(a, b) {
  return (
    a.start.line > b.start.line ||
    (a.start.line === b.start.line && a.start.column > b.start.column)
  );
}

export function containsPosition(a, b) {
  const bColumn = b.column || 0;
  const startsBefore =
    a.start.line < b.line || (a.start.line === b.line && a.start.column <= bColumn);
  const endsAfter = a.end.line > b.line || (a.end.line === b.line && a.end.column >= bColumn);

  return startsBefore && endsAfter;
}

function findClosestofSymbol(declarations, location) {
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
    if (found.location.start.line > currNode.location.start.line) {
      return found;
    }
    if (
      found.location.start.line === currNode.location.start.line &&
      found.location.start.column > currNode.location.start.column
    ) {
      return found;
    }

    return currNode;
  }, null);
}

export function findClosestFunction(symbols, location) {
  if (!symbols || symbols.loading) {
    return null;
  }

  return findClosestofSymbol(symbols.functions, location);
}

export function findClosestClass(symbols, location) {
  if (!symbols || symbols.loading) {
    return null;
  }

  return findClosestofSymbol(symbols.classes, location);
}

export function findClosestEnclosedSymbol(symbols, location) {
  let classes = [];
  let functions = [];

  if (symbols && !symbols.loading) {
    ({ classes, functions } = symbols);
  }

  return findClosestofSymbol([...functions, ...classes], location);
}
