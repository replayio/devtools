/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

export function tokenAtTextPosition(cm, { line, column }) {
  if (line < 0 || line >= cm.lineCount()) {
    return null;
  }

  const token = cm.getTokenAt({ ch: column, line: line - 1 });
  if (!token) {
    return null;
  }

  return { endColumn: token.end, startColumn: token.start, type: token.type };
}

// The strategy of querying codeMirror tokens was borrowed
// from Chrome's inital implementation in JavaScriptSourceFrame.js#L414
export function getExpressionFromCoords(cm, coord) {
  const token = tokenAtTextPosition(cm, coord);
  if (!token) {
    return null;
  }

  let startHighlight = token.startColumn;
  const endHighlight = token.endColumn;
  const lineNumber = coord.line;
  const line = cm.doc.getLine(coord.line - 1);
  while (startHighlight > 1 && line.charAt(startHighlight - 1) === ".") {
    const tokenBefore = tokenAtTextPosition(cm, {
      column: startHighlight - 1,
      line: coord.line,
    });

    if (!tokenBefore || !tokenBefore.type) {
      return null;
    }

    // Bail from the loop if we run into a spread operator
    if (line.substring(tokenBefore.startColumn, tokenBefore.endColumn) === "...") {
      break;
    }

    startHighlight = tokenBefore.startColumn;
  }

  const expression = line.substring(startHighlight, endHighlight) || "";

  if (!expression) {
    return null;
  }

  const location = {
    end: { column: endHighlight, line: lineNumber },
    start: { column: startHighlight, line: lineNumber },
  };
  return { expression, location };
}
