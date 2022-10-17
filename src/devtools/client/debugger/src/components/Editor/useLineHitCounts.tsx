import { FocusContext } from "bvaughn-architecture-demo/src/contexts/FocusContext";
import { SourcesContext } from "bvaughn-architecture-demo/src/contexts/SourcesContext";
import {
  getCachedMinMaxSourceHitCounts,
  getSourceHitCounts,
} from "bvaughn-architecture-demo/src/suspense/SourcesCache";
import type { SourceEditor } from "devtools/client/debugger/src/utils/editor/source-editor";
import { resizeBreakpointGutter } from "devtools/client/debugger/src/utils/ui";
import { useContext, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { LineNumberToHitCountMap } from "shared/client/types";
import { useFeature, useStringPref } from "ui/hooks/settings";
import { getFocusRegion } from "ui/reducers/timeline";
import { useAppSelector } from "ui/setup/hooks";
import { FocusRegion } from "ui/state/timeline";

import styles from "./LineHitCounts.module.css";

export default function useLineHitCounts(sourceEditor: SourceEditor | null) {
  const { value: disableUnHitLines } = useFeature("disableUnHitLines");
  const { value: hitCountsEnabled } = useFeature("hitCounts");
  const { value: hitCountsMode, update: updateHitCountsMode } = useStringPref("hitCounts");

  const { focusedSourceId: sourceId, hoveredLineIndex, visibleLines } = useContext(SourcesContext);

  const replayClient = useContext(ReplayClientContext);
  const { range: focusRange } = useContext(FocusContext);
  const hitCounts =
    sourceId && visibleLines
      ? getSourceHitCounts(replayClient, sourceId, visibleLines, focusRange)
      : null;

  // Min/max hit counts are used to determine heat map color.
  const [minHitCount, maxHitCount] = sourceId
    ? getCachedMinMaxSourceHitCounts(sourceId, focusRange)
    : [null, null];

  const focusRegion = useAppSelector(getFocusRegion);

  const previousFocusRegion = useRef<FocusRegion | null>(null);
  const previousHitCounts = useRef<LineNumberToHitCountMap | null>(null);

  const isCollapsed = hitCountsMode == "hide-counts";

  const isCurrentLineNumberValid = hoveredLineIndex != null;

  const lower = visibleLines ? visibleLines.start.line : null;
  const upper = visibleLines ? visibleLines.end.line : null;

  // Make sure we have enough room to fit large hit count numbers in the gutter markers
  const numCharsToFit = useMemo(() => {
    if (maxHitCount === null) {
      return 0;
    }

    const numCharsToFit =
      maxHitCount < 1000
        ? Math.max(2, maxHitCount.toString().length)
        : `${(maxHitCount / 1000).toFixed(1)}k`.length;
    return numCharsToFit;
  }, [maxHitCount]);

  const gutterWidth = isCollapsed ? "5px" : `${numCharsToFit + 1}ch`;

  // Save `isCollapsed` in a ref so we only create `marker.onClick` callbacks once
  // TODO Candidate for the eventual `useEvent` hook?
  const isCollapsedRef = useRef(isCollapsed);

  useLayoutEffect(() => {
    isCollapsedRef.current = isCollapsed;
  }, [isCollapsed]);

  useLayoutEffect(() => {
    if (!sourceEditor) {
      return;
    }

    const { editor } = sourceEditor;

    // Tell CodeMirror to actually create a gutter column for hit counts
    editor.setOption("gutters", [
      "breakpoints",
      "CodeMirror-linenumbers",
      { className: "hit-markers", style: `width: ${gutterWidth}` },
    ]);
    resizeBreakpointGutter(editor);

    // HACK
    // When hit counts are shown, the hover button (to add a log point) should not overlap with the gutter.
    // That component doesn't know about hit counts though, so we can inform its position via a CSS variable.
    const gutterElement = sourceEditor.codeMirror.getGutterElement() as HTMLElement;

    gutterElement.parentElement!.style.setProperty("--hit-count-gutter-width", `-${gutterWidth}`);

    // If hit counts are shown, the button should not overlap with the gutter.
    // The gutter size changes though based on the number of hits, so we use a CSS variable.
    gutterElement.parentElement!.style.setProperty(
      "--print-statement-right-offset",
      hitCountsMode === "show-counts"
        ? "calc(var(--hit-count-gutter-width) - 6px)"
        : hitCountsMode === "hide-counts"
        ? "-10px"
        : "0px"
    );

    return () => {
      try {
        editor.setOption("gutters", ["breakpoints", "CodeMirror-linenumbers"]);
      } catch (e) {
        console.warn(e);
      }
      resizeBreakpointGutter(editor);
    };
  }, [gutterWidth, sourceEditor, isCollapsed, hitCountsMode]);

  useLayoutEffect(() => {
    if (!hitCountsEnabled) {
      return;
    }

    if (sourceEditor === null) {
      return;
    }

    const { editor } = sourceEditor;

    const drawLines = () => {
      if (lower === null || upper === null) {
        return;
      }

      editor.operation(() => {
        editor.eachLine(lower, upper, lineHandle => {
          const currentCMLineNumber = editor.getLineNumber(lineHandle);
          if (currentCMLineNumber === null) {
            return;
          }

          // CM uses 0-based indexing. Our hit counts are 1-indexed.
          let oneIndexedLineNumber = currentCMLineNumber + 1;

          const lineHitCounts = hitCounts?.get(oneIndexedLineNumber);

          // If there are multiple hits for this line, only display the first one.
          const hits = lineHitCounts ? lineHitCounts.count : 0;

          // We use a gradient to indicate the "heat" (the number of hits).
          // This absolute hit count values are relative, per file.
          // Cubed root prevents high hit counts from lumping all other values together.
          const NUM_GRADIENT_COLORS = 3;
          let className = styles.HitsBadge0;
          let index = NUM_GRADIENT_COLORS - 1;
          if (hits > 0 && minHitCount !== null && maxHitCount !== null) {
            if (minHitCount !== maxHitCount) {
              index = Math.min(
                NUM_GRADIENT_COLORS - 1,
                Math.round(
                  ((hits - minHitCount) / (maxHitCount - minHitCount)) * NUM_GRADIENT_COLORS
                )
              );
            }
            className = styles[`HitsBadge${index + 1}`];
          }

          if (disableUnHitLines) {
            if (hits > 0) {
              sourceEditor.codeMirror.removeLineClass(lineHandle, "line", "empty-line");
            } else {
              // If this line wasn't hit any, dim the line number,
              // even if it's a line that's technically reachable.
              sourceEditor.codeMirror.addLineClass(lineHandle, "line", "empty-line");
            }
          }

          const info = editor.lineInfo(lineHandle);

          let markerNode: HTMLDivElement;
          if (info?.gutterMarkers?.["hit-markers"]) {
            // Retrieve the marker DOM node we already created
            markerNode = info.gutterMarkers["hit-markers"];
          } else {
            markerNode = document.createElement("div");
            markerNode.onclick = () =>
              updateHitCountsMode(isCollapsedRef.current ? "show-counts" : "hide-counts");

            editor.setGutterMarker(lineHandle, "hit-markers", markerNode);
          }

          markerNode.className = className;
          if (!isCollapsed) {
            let hitsLabel = "";
            if (hits > 0) {
              hitsLabel = hits < 1000 ? `${hits}` : `${(hits / 1000).toFixed(1)}k`;
            }
            markerNode.textContent = hitsLabel;
          }
          markerNode.title = `${hits} hits`;
        });
      });
    };

    let animationFrameId: number | null = 0;
    const drawLinesRaf = () => {
      animationFrameId = requestAnimationFrame(drawLines);
    };

    editor.on("change", drawLinesRaf);
    editor.on("swapDoc", drawLinesRaf);
    editor.on("scroll", drawLinesRaf);

    drawLines();

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      editor.off("change", drawLinesRaf);
      editor.off("swapDoc", drawLinesRaf);
      editor.off("scroll", drawLinesRaf);
    };
  }, [
    disableUnHitLines,
    hitCountsEnabled,
    hitCounts,
    isCollapsed,
    isCurrentLineNumberValid,
    focusRegion,
    lower,
    maxHitCount,
    minHitCount,
    sourceEditor,
    sourceId,
    updateHitCountsMode,
    upper,
  ]);

  useEffect(() => {
    // Save the previous references for comparison in `drawLines`
    previousFocusRegion.current = focusRegion;
    previousHitCounts.current = hitCounts;
  }, [focusRegion, hitCounts]);
}
