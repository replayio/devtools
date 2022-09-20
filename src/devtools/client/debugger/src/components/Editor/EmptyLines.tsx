/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */
import { useMemo, useEffect } from "react";

import { useAppSelector } from "ui/setup/hooks";

import { fromEditorLine } from "../../utils/editor";
import { getBreakableLinesForSelectedSource } from "ui/reducers/possibleBreakpoints";

import { getSelectedSourceId } from "ui/reducers/sources";

import { calculateRangeChunksForVisibleLines } from "devtools/client/debugger/src/utils/editor/lineHitCounts";

import type { SourceEditor } from "../../utils/editor/source-editor";

interface ELProps {
  editor: SourceEditor;
}

export default function EmptyLines({ editor }: ELProps) {
  const breakableLines = useAppSelector(getBreakableLinesForSelectedSource);
  const sourceId = useAppSelector(getSelectedSourceId)!;

  const drawnRanges = useMemo(() => {
    return new Set<number>();
    // We _want_ a new set every time breakableLines changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breakableLines, sourceId]);

  useEffect(() => {
    let animationFrameId: number | null = null;
    function disableEmptyLinesRaf() {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(() => {
        animationFrameId = null;
        disableEmptyLines();
      });
    }

    function disableEmptyLines() {
      const uniqueChunks = calculateRangeChunksForVisibleLines(editor);

      // Attempt to update lines in the 100-line blocks surrounding the
      // visible area on screen
      editor.codeMirror.operation(() => {
        for (let hitCountChunk of uniqueChunks) {
          const { lower, upper } = hitCountChunk;

          if (drawnRanges.has(lower)) {
            continue;
          }
          drawnRanges.add(lower);

          editor.codeMirror.eachLine(lower, upper, lineHandle => {
            const line = fromEditorLine(editor.codeMirror.getLineNumber(lineHandle)!);

            if (breakableLines?.includes(line)) {
              editor.codeMirror.removeLineClass(lineHandle, "line", "empty-line");
            } else {
              editor.codeMirror.addLineClass(lineHandle, "line", "empty-line");
            }
          });
        }
      });
    }

    editor.editor.on("scroll", disableEmptyLinesRaf);
    editor.editor.on("change", disableEmptyLinesRaf);
    editor.editor.on("swapDoc", disableEmptyLinesRaf);

    disableEmptyLinesRaf();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      editor.editor.off("scroll", disableEmptyLinesRaf);
      editor.editor.off("change", disableEmptyLinesRaf);
      editor.editor.off("swapDoc", disableEmptyLinesRaf);
    };
  }, [breakableLines, drawnRanges, editor, sourceId]);

  return null;
}
