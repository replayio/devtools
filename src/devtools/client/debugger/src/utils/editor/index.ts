/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

export * from "./source-documents";
export * from "./source-search";
export * from "../ui";
export { onTokenMouseOver } from "./token-events";
export { onLineMouseOver } from "./line-events";

import { SourceLocation } from "graphql";
import { SourceDetails } from "ui/reducers/sources";
import { SearchQueryModifiers } from "../build-query";
import { createEditor } from "./create-editor";
import type { SourceEditor, EditorWithDoc } from "./source-editor";
import { findNext, findPrev } from "./source-search";

let editor: SourceEditor | null;

type $FixTypeLater = any;

type ObjWithEditor = { codeMirror: EditorWithDoc };

export function getEditor() {
  if (editor) {
    return editor;
  }

  editor = createEditor();
  return editor;
}

export function removeEditor() {
  editor = null;
}

export function getCodeMirror() {
  return editor?.codeMirror;
}

export function startOperation() {
  const codeMirror = getCodeMirror();
  if (!codeMirror) {
    return;
  }

  codeMirror.startOperation();
}

export function endOperation() {
  const codeMirror = getCodeMirror();
  if (!codeMirror) {
    return;
  }

  codeMirror.endOperation();
}

export function traverseResults(
  e: KeyboardEvent,
  ctx: $FixTypeLater,
  query: string,
  dir: "next" | "prev",
  modifiers: SearchQueryModifiers
) {
  e.stopPropagation();
  e.preventDefault();

  if (dir == "prev") {
    findPrev(ctx, query, true, modifiers);
  } else if (dir == "next") {
    findNext(ctx, query, true, modifiers);
  }
}

export function toEditorLine(lineOrOffset?: number) {
  return lineOrOffset ? lineOrOffset - 1 : 1;
}

export function fromEditorLine(line: number) {
  return line + 1;
}

export function toEditorColumn(lineText: string, column: number) {
  if (!lineText) {
    return 0;
  }

  let pointOffset = 0;
  let unitOffset = 0;
  for (const c of lineText) {
    if (pointOffset >= column) {
      break;
    }
    pointOffset += 1;
    unitOffset += c.length;
  }
  return unitOffset;
}

export function fromEditorColumn(lineText: string, column: number) {
  let pointOffset = 0;
  let unitOffset = 0;
  for (const c of lineText) {
    if (unitOffset >= column) {
      break;
    }
    pointOffset += 1;
    unitOffset += c.length;
  }
  return pointOffset;
}

export function scrollToColumn(codeMirror: EditorWithDoc, line: number, column: number) {
  const { top, left } = codeMirror.charCoords({ line, ch: column }, "local");

  if (!isVisible(codeMirror, top, left)) {
    const scroller = codeMirror.getScrollerElement();
    const centeredX = Math.max(left - scroller.offsetWidth / 2, 0);
    const centeredY = Math.max(top - scroller.offsetHeight / 2, 0);

    codeMirror.scrollTo(centeredX, centeredY);
  }
}

function isVisible(codeMirror: EditorWithDoc, top: number, left: number) {
  function withinBounds(x: number, min: number, max: number) {
    return x >= min && x <= max;
  }

  const scrollArea = codeMirror.getScrollInfo();
  const charWidth = codeMirror.defaultCharWidth();
  const fontHeight = codeMirror.defaultTextHeight();
  // @ts-expect-error scroll fields not in Doc ?
  const { scrollTop, scrollLeft } = codeMirror.doc;

  const inXView = withinBounds(
    left,
    scrollLeft,
    scrollLeft + (scrollArea.clientWidth - 30) - charWidth
  );

  const inYView = withinBounds(top, scrollTop, scrollTop + scrollArea.clientHeight - fontHeight);

  return inXView && inYView;
}

export function getLocationsInViewport(
  { codeMirror }: ObjWithEditor,
  // Offset represents an allowance of characters or lines offscreen to improve
  // perceived performance of column breakpoint rendering
  offsetHorizontalCharacters = 100
) {
  // Get scroll position
  if (!codeMirror) {
    return {
      start: { line: 0, column: 0 },
      end: { line: 0, column: 0 },
    };
  }
  const charWidth = codeMirror.defaultCharWidth();
  const scrollArea = codeMirror.getScrollInfo();
  // @ts-expect-error scroll fields not in Doc ?
  const { scrollLeft } = codeMirror.doc;

  const leftColumn = Math.floor(
    scrollLeft > 0 ? scrollLeft / charWidth - offsetHorizontalCharacters : 0
  );
  const rightPosition = scrollLeft + (scrollArea.clientWidth - 30);
  const rightCharacter = Math.floor(rightPosition / charWidth) + offsetHorizontalCharacters;

  // This is used to tell codemirror what part of the
  // source file is within the viewport so it knows what
  // breakpoint widgets to render.
  // We're setting start to zero and end to infinity because
  // we want all breakpoint widgets to be rendered on load
  // without removing and re-adding them as they leave the
  // viewport while a user is scrolling through the file
  return {
    start: {
      line: 0,
      column: leftColumn || 0,
    },
    end: {
      line: Number.POSITIVE_INFINITY,
      column: rightCharacter,
    },
  };
}

export function markText(
  { codeMirror }: ObjWithEditor,
  className: string,
  { start, end }: { start: SourceLocation; end: SourceLocation }
) {
  return codeMirror!.markText(
    { ch: start.column, line: start.line },
    { ch: end.column, line: end.line },
    { className }
  );
}

export function lineAtHeight({ codeMirror }: ObjWithEditor, event: MouseEvent) {
  const editorLine = codeMirror!.lineAtHeight(event.clientY);
  return fromEditorLine(editorLine);
}

export function getSourceLocationFromMouseEvent(
  { codeMirror }: ObjWithEditor,
  source: SourceDetails,
  e: MouseEvent
) {
  const { line, ch } = codeMirror!.coordsChar({
    left: e.clientX,
    top: e.clientY,
  });
  const sourceId = source.id;

  const lineText = codeMirror.doc.getLine(line);

  return {
    sourceId,
    line: fromEditorLine(line),
    column: fromEditorColumn(lineText, ch),
  };
}

export function forEachLine(codeMirror: EditorWithDoc, iter: $FixTypeLater) {
  codeMirror.operation(() => {
    // @ts-expect-error iter doesn't exist
    codeMirror.doc.iter(0, codeMirror.lineCount(), iter);
  });
}

export function removeLineClass(codeMirror: EditorWithDoc, line: number, className: string) {
  codeMirror.removeLineClass(line, "line", className);
}

export function clearLineClass(codeMirror: EditorWithDoc, className: string) {
  forEachLine(codeMirror, (line: number) => {
    removeLineClass(codeMirror, line, className);
  });
}

export function getTextForLine(codeMirror: EditorWithDoc, line: number) {
  return codeMirror.getLine(line - 1).trim();
}

export function getCursorLine(codeMirror: EditorWithDoc) {
  return codeMirror.getCursor().line;
}

export function getCursorColumn(codeMirror: EditorWithDoc) {
  return codeMirror.getCursor().ch;
}

export function getTokenEnd(codeMirror: EditorWithDoc, line: number, column: number) {
  const token = codeMirror.getTokenAt({
    line,
    ch: column,
  });
  const tokenString = token.string;

  return tokenString === "{" || tokenString === "[" ? null : token.end;
}

export function inBreakpointPanel(e: React.MouseEvent<HTMLDivElement>) {
  return (e.relatedTarget as HTMLElement).closest?.(".breakpoint-panel");
}
