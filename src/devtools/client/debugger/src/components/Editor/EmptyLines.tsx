import { SourceId } from "@replayio/protocol";
import { SourcesContext } from "bvaughn-architecture-demo/src/contexts/SourcesContext";
import { getBreakpointPositionsAsync } from "bvaughn-architecture-demo/src/suspense/SourcesCache";
import type { SourceEditor } from "devtools/client/debugger/src/utils/editor/source-editor";
import { useEffect, useContext, useRef } from "react";
import { replayClient } from "shared/client/ReplayClientContext";

interface ELProps {
  editor: SourceEditor;
}

export default function EmptyLines({ editor }: ELProps) {
  const { focusedSourceId: sourceId, visibleLines } = useContext(SourcesContext);

  const memoizedDrawnLinesRef = useRef<{
    drawnLinesSet: Set<number>;
    sourceId: SourceId | null;
  }>({
    drawnLinesSet: new Set(),
    sourceId: null,
  });

  useEffect(() => {
    let animationFrameId: number | null = null;

    const memoizedDrawnLines = memoizedDrawnLinesRef.current;

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

      const breakpointPositions = await getBreakpointPositionsAsync(replayClient, sourceId);
      const breakableLines = breakpointPositions.map(({ line }) => line);

      // For performance reasons, we should only modify lines (chunks of lines in this case) once.
      // However if the breakpoint positions change, we need to re-draw things.
      if (memoizedDrawnLines.sourceId !== sourceId) {
        memoizedDrawnLines.drawnLinesSet = new Set();
        memoizedDrawnLines.sourceId = sourceId;
      }

      editor.codeMirror.operation(() => {
        const lower = visibleLines.start.line;
        const upper = visibleLines.end.line;

        if (!memoizedDrawnLines.drawnLinesSet.has(lower)) {
          memoizedDrawnLines.drawnLinesSet.add(lower);

          editor.codeMirror.eachLine(lower, upper, lineHandle => {
            const line = editor.codeMirror.getLineNumber(lineHandle)! + 1;
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
  }, [editor, replayClient, sourceId, visibleLines]);

  return null;
}
