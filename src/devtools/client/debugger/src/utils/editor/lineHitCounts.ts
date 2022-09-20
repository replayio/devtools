import { getUniqueHitCountsChunksForLines } from "ui/reducers/hitCounts";

import { SourceEditor } from "./source-editor";

export function calculateRangeChunksForVisibleLines(editor: SourceEditor) {
  var rect = editor.codeMirror.getWrapperElement().getBoundingClientRect();
  var topVisibleLine = editor.codeMirror.lineAtHeight(rect.top, "window");
  var bottomVisibleLine = editor.codeMirror.lineAtHeight(rect.bottom, "window");

  const viewport = editor.editor.getViewport();
  const { from: topViewportLine, to: bottomViewportLine } = viewport;
  const centerLine = ((bottomViewportLine - topViewportLine) / 2) | 0;

  // We want to try to ensure we have hit counts above and below the viewport
  // Can't go less than line index 0, though
  const bufferAboveLine = Math.max(topVisibleLine - 10, 0);
  const bufferBelowLine = bottomVisibleLine + 10;

  // But, some of these lines could belong to the same 100-line chunk
  const uniqueChunks = getUniqueHitCountsChunksForLines(
    centerLine,
    bufferAboveLine,
    bufferBelowLine
  );
  return uniqueChunks;
}
