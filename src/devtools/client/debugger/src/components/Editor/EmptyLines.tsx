import { SourcesContext } from "bvaughn-architecture-demo/src/contexts/SourcesContext";
import { getBreakpointPositionsAsync } from "bvaughn-architecture-demo/src/suspense/SourcesCache";
import { useMemo, useEffect, useContext } from "react";
import { replayClient } from "shared/client/ReplayClientContext";

import { fromEditorLine } from "../../utils/editor";
import type { SourceEditor } from "../../utils/editor/source-editor";

interface ELProps {
  editor: SourceEditor;
}

export default function EmptyLines({ editor }: ELProps) {
  const { focusedSourceId: sourceId, visibleLines } = useContext(SourcesContext);

  const drawnRanges = useMemo(() => {
    return new Set<number>();
    // We _want_ a new set every time breakableLines changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceId]);

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

    async function disableEmptyLines() {
      if (visibleLines === null || sourceId === null) {
        return;
      }

      const breakpointPositions = await getBreakpointPositionsAsync(
        replayClient,
        sourceId,
        visibleLines
      );
      const breakableLines = breakpointPositions.map(({ line }) => line);

      editor.codeMirror.operation(() => {
        const lower = visibleLines.start.line;
        const upper = visibleLines.end.line;

        if (!drawnRanges.has(lower)) {
          drawnRanges.add(lower);

          editor.codeMirror.eachLine(lower, upper, lineHandle => {
            const line = fromEditorLine(editor.codeMirror.getLineNumber(lineHandle)!);
            if (breakableLines.includes(line)) {
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

    // ESLint thinks ReplayClient isn't necessary because it's used in an async function.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawnRanges, editor, replayClient, sourceId, visibleLines]);

  return null;
}
