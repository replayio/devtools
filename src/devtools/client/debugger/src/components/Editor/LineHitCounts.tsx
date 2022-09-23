import { useMemo, useLayoutEffect, useRef, useEffect } from "react";
import { useFeature } from "ui/hooks/settings";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import { getSelectedSourceId } from "ui/reducers/sources";
import { useStringPref } from "ui/hooks/settings";

import styles from "./LineHitCounts.module.css";
import { features } from "ui/utils/prefs";

import { resizeBreakpointGutter } from "../../utils/ui";
import {
  fetchHitCounts,
  HitCount,
  getHitCountsForSource,
  getBoundsForLineNumber,
} from "ui/reducers/hitCounts";
import { UIState } from "ui/state";
import type { SourceEditor } from "../../utils/editor/source-editor";
import { getFocusRegion } from "ui/reducers/timeline";
import { FocusRegion } from "ui/state/timeline";
import { calculateRangeChunksForVisibleLines } from "devtools/client/debugger/src/utils/editor/lineHitCounts";

type Props = {
  sourceEditor: SourceEditor;
};

export default function LineHitCountsWrapper(props: Props) {
  const { value: hitCountsEnabled } = useFeature("hitCounts");
  const { value: hitCountsMode } = useStringPref("hitCounts");

  if (!hitCountsEnabled || hitCountsMode == "disabled") {
    return null;
  }

  return <LineHitCounts {...props} />;
}

function LineHitCounts({ sourceEditor }: Props) {
  const dispatch = useAppDispatch();
  const sourceId = useAppSelector(getSelectedSourceId)!;
  const hitCounts = useAppSelector(state => getHitCountsForSource(state, sourceId));
  const { value: hitCountsMode, update: updateHitCountsMode } = useStringPref("hitCounts");
  const currentLineNumber = useAppSelector(
    (state: UIState) => state.app.hoveredLineNumberLocation?.line
  );
  const focusRegion = useAppSelector(getFocusRegion);

  const previousFocusRegion = useRef<FocusRegion | null>(null);
  const previousHitCounts = useRef<Map<number, number> | null>(null);

  const isCollapsed = hitCountsMode == "hide-counts";
  const isCurrentLineNumberValid = currentLineNumber !== undefined;
  const { lower, upper } = getBoundsForLineNumber(currentLineNumber || 0);

  const hitCountMap = useMemo(() => {
    if (hitCounts !== null) {
      const hitCountsMap = hitCountsToMap(hitCounts);
      return hitCountsMap;
    }
    return null;
  }, [hitCounts]);

  const updatedLineNumbers = useMemo(() => {
    return new Set<number>();
    // We _want_ this re-created every time these change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hitCountMap, isCollapsed]);

  // Min/max hit counts are used to determine heat map color.
  const [minHitCount, maxHitCount] = useMemo(() => {
    let minHitCount = Infinity;
    let maxHitCount = 0;
    if (hitCounts) {
      // Iterate the entire array once to find min/max as we go
      for (let { hits } of hitCounts) {
        if (hits > 0) {
          if (minHitCount > hits) {
            minHitCount = hits;
          }
          if (maxHitCount < hits) {
            maxHitCount = hits;
          }
        }
      }
    }
    return [minHitCount, maxHitCount] as const;
  }, [hitCounts]);

  useLayoutEffect(() => {
    // HACK Make sure we load hit count metadata; normally this is done in response to a mouseover event.
    if (hitCounts === null) {
      dispatch(fetchHitCounts(sourceId, 0));
    }
  }, [dispatch, sourceId, hitCounts]);

  // Make sure we have enough room to fit large hit count numbers in the gutter markers
  const numCharsToFit = useMemo(() => {
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
    document
      .querySelector(".editor-wrapper")
      ?.style.setProperty(
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
    if (!sourceEditor) {
      return;
    }

    const { editor } = sourceEditor;

    const drawLines = () => {
      const uniqueChunks = calculateRangeChunksForVisibleLines(sourceEditor);

      editor.operation(() => {
        for (let hitCountChunk of uniqueChunks) {
          // Attempt to update just the markers for just the 100-line blocks
          // overlapping the visible display area
          const { lower, upper } = hitCountChunk;
          editor.eachLine(lower, upper, lineHandle => {
            const currentCMLineNumber = editor.getLineNumber(lineHandle);
            if (currentCMLineNumber === null) {
              return;
            }

            // CM uses 0-based indexing. Our hit counts are 1-indexed.
            let oneIndexedLineNumber = currentCMLineNumber + 1;
            const hitCount = hitCountMap?.get(oneIndexedLineNumber) || 0;

            // We use a gradient to indicate the "heat" (the number of hits).
            // This absolute hit count values are relative, per file.
            // Cubed root prevents high hit counts from lumping all other values together.
            const NUM_GRADIENT_COLORS = 3;
            let className = styles.HitsBadge0;
            let index = NUM_GRADIENT_COLORS - 1;
            if (hitCount > 0) {
              if (minHitCount !== maxHitCount) {
                index = Math.min(
                  NUM_GRADIENT_COLORS - 1,
                  Math.round(
                    ((hitCount - minHitCount) / (maxHitCount - minHitCount)) * NUM_GRADIENT_COLORS
                  )
                );
              }
              className = styles[`HitsBadge${index + 1}`];
            }

            if (features.disableUnHitLines) {
              if (hitCount > 0) {
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
              if (hitCount > 0) {
                hitsLabel = hitCount < 1000 ? `${hitCount}` : `${(hitCount / 1000).toFixed(1)}k`;
              }
              markerNode.textContent = hitsLabel;
            }
            markerNode.title = `${hitCount} hits`;
          });
        }
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
    sourceEditor,
    sourceId,
    hitCountMap,
    updatedLineNumbers,
    isCollapsed,
    minHitCount,
    maxHitCount,
    updateHitCountsMode,
    lower,
    upper,
    isCurrentLineNumberValid,
    focusRegion,
  ]);

  useEffect(() => {
    // Save the previous references for comparison in `drawLines`
    previousFocusRegion.current = focusRegion;
    previousHitCounts.current = hitCountMap;
  }, [focusRegion, hitCountMap]);

  // We're just here for the hooks!
  return null;
}

function hitCountsToMap(hitCounts: HitCount[]): Map<number, number> {
  const hitCountMap: Map<number, number> = new Map();
  hitCounts.forEach(hitCount => {
    const line = hitCount.location.line;
    hitCountMap.set(line, (hitCountMap.get(line) || 0) + hitCount.hits);
  });
  return hitCountMap;
}
