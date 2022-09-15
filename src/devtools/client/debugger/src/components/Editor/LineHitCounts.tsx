import React, {
  useState,
  useMemo,
  useLayoutEffect,
  useRef,
  useEffect,
  useCallback,
  useReducer,
} from "react";
import { createPortal } from "react-dom";
import { VariableSizeList as List } from "react-window";

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
import { getLogpointSources } from "devtools/client/debugger/src/selectors/breakpointSources";
import { LineHandle } from "codemirror";

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
  const logpointSources = useAppSelector(getLogpointSources);

  const { value: enableLargeText } = useFeature("enableLargeText");

  const previousFocusRegion = useRef<FocusRegion | null>(null);
  const previousHitCounts = useRef<Map<number, number> | null>(null);
  const hitCountsListRef = useRef<List>(null);

  const isCollapsed = hitCountsMode == "hide-counts";

  const toggleHitCountNumbers = useCallback(() => {
    updateHitCountsMode(isCollapsed ? "show-counts" : "hide-counts");
  }, [isCollapsed, updateHitCountsMode]);

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

  const gutterWidth = isCollapsed ? "1ch" : `${numCharsToFit + 1}ch`;

  useLayoutEffect(() => {
    if (!sourceEditor) {
      return;
    }

    const { editor } = sourceEditor;

    // Tell CodeMirror to actually create a gutter column for hit counts.
    // Note that this now only creates the horizontal space we need - it doesn't
    // actually _show_ the hit count numbers. Instead, we overlay a virtual list
    // absolutely positioned on top of this gutter, so we can render them faster.
    editor.setOption("gutters", [
      "breakpoints",
      "CodeMirror-linenumbers",
      { className: "hit-markers", style: `width: ${gutterWidth}` },
    ]);
    resizeBreakpointGutter(editor);

    // HACK
    // When hit counts are shown, the hover button (to add a log point) should not overlap with the gutter.
    // That component doesn't know about hit counts though, so we can inform its position via a CSS variable.
    const gutterElement = sourceEditor.codeMirror.getGutterElement();
    (gutterElement as HTMLElement).parentElement!.style.setProperty(
      "--hit-count-gutter-width",
      `-${gutterWidth}`
    );

    return () => {
      try {
        // Remove the hit count gutter.
        editor.setOption("gutters", ["breakpoints", "CodeMirror-linenumbers"]);
      } catch (e) {
        console.warn(e);
      }
      resizeBreakpointGutter(editor);
    };
  }, [gutterWidth, sourceEditor, isCollapsed]);

  useLayoutEffect(() => {
    if (!sourceEditor) {
      return;
    }

    const { editor } = sourceEditor;

    const drawLines = () => {
      let lineNumber = lower;
      const focusRegionChanged = focusRegion !== previousFocusRegion.current;
      const hitCountMapChanged = hitCountMap !== previousHitCounts.current;

      // `drawLines` will run reasonably often. However, we will often
      // want to bail out early and _not_ apply updates to the gutter markers.
      // The main reason to bail out is if there is no current line number,
      // which happens any time the mouse is over an "inactive" line in the editor,
      // or outside the editor entirely.
      // However, there are a couple situations when we _do_ still want to redraw
      // even if the mouse isn't over a valid line:
      // - The focus region just changed
      // - We refetched hit counts due to the user closing the focus bar
      if (!isCurrentLineNumberValid && !focusRegionChanged && !hitCountMapChanged) {
        return;
      }

      // Attempt to update just the markers for just the 100-line blocks  surrounding
      // the current line number
      editor.eachLine(lower, upper, lineHandle => {
        lineNumber++;

        // Skip this line if we've updated it with its current hit count already
        if (updatedLineNumbers?.has(lineNumber)) {
          return;
        }

        updatedLineNumbers?.add(lineNumber);

        const hitCount = hitCountMap?.get(lineNumber + 1) || 0;

        if (features.disableUnHitLines) {
          if (hitCount > 0) {
            sourceEditor.codeMirror.removeLineClass(lineHandle, "line", "empty-line");
          } else {
            // If this line wasn't hit any, dim the line number,
            // even if it's a line that's technically reachable.
            sourceEditor.codeMirror.addLineClass(lineHandle, "line", "empty-line");
          }
        }
      });
    };

    editor.on("change", drawLines);
    editor.on("swapDoc", drawLines);

    drawLines();

    return () => {
      editor.off("change", drawLines);
      editor.off("swapDoc", drawLines);
    };
  }, [
    sourceEditor,
    hitCountMap,
    updatedLineNumbers,
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

  // Access the actual CodeMirror scrolling element, so we can read some bounds.
  // This isn't ideal, but we can assume it exists by now.
  const scroller = sourceEditor.editor.getScrollerElement();

  // Look up the print statement definitions for this file
  const logpointsForSource = logpointSources.find(entry => entry.source?.id === sourceId);

  useLayoutEffect(() => {
    // MAGIC: every time the user scrolls CodeMirror, scroll our hit counts virtual list
    // to the exact same scroll position to keep them in sync.
    return sourceEditor.editor.on("scroll", () => {
      hitCountsListRef.current?.scrollTo(scroller.scrollTop);
    });
  }, [sourceId, sourceEditor.editor, scroller]);

  useLayoutEffect(() => {
    if (logpointsForSource) {
      /*
        HACK Synchronously force `react-window` to draw and check sizes of
        each print statement in this file.
        
        `react-window` caches item sizes after they've been measured.
        If we have print statements, we need to force it to measure those
        lines so it knows they're bigger than normal, and can use those
        in its positioning calculations for later lines.
        That way if we are viewing lines far past the line with the print statement,
        `react-window` should take those larger lines into account and work right.
        This isn't ideal perf-wise, but typically there's only a handful of print
        statements per file, and we only do this when the list of print statements changes.
      */
      for (let printStatement of logpointsForSource.breakpoints) {
        hitCountsListRef.current?.scrollToItem(printStatement.location.line);
      }

      // Then reset the scroll position to match the actual editor
      hitCountsListRef.current?.scrollTo(scroller.scrollTop);
    }
  }, [logpointsForSource, scroller]);

  const hitsGutter = scroller.querySelector(".CodeMirror-gutter.hit-markers") as HTMLElement;
  if (!hitsGutter) {
    return null;
  }

  const firstLineHandle = sourceEditor.editor.getLineHandle(1) as LineHandle & { height: number };
  const numPrintStatements = logpointsForSource?.breakpoints.length || 0;

  const defaultItemHeight = firstLineHandle?.height ?? 15;
  // From inspection - if our print statement CSS changes this will need to also
  const EXPECTED_PRINT_STATEMENT_HEIGHT = 94;

  const totalLines = sourceEditor.editor.lineCount() || 1;

  const totalDocumentHeight = scroller.getBoundingClientRect().height;
  const combinedPrintStatementSize = EXPECTED_PRINT_STATEMENT_HEIGHT * numPrintStatements;

  // Give `react-window` a proper estimate of all other actual line heights
  const estimatedSize = (totalDocumentHeight - combinedPrintStatementSize) / totalLines;

  return createPortal(
    <div
      className="hitCountsOverlay"
      // Match the positioning of the now-empty hit counts gutter inside of CodeMirror
      style={{
        position: "absolute",
        width: "100%",
        top: 0,
        left: 0,
        height: "100%",
        paddingTop: 4,
      }}
    >
      <List
        height={totalDocumentHeight}
        itemCount={totalLines}
        estimatedItemSize={estimatedSize}
        // Force recreating the list if any of these change
        key={`${sourceId}${logpointsForSource?.breakpoints.length}${enableLargeText}`}
        itemSize={index => {
          const lineHandle = sourceEditor.editor.getLineHandle(index) as LineHandle & {
            height: number;
          };
          // CodeMirror keeps the _actual_ line height in an internal field.
          // By reusing that, we can get consistent heights for our virtualized list items.
          const itemHeight: number = lineHandle?.height ?? defaultItemHeight;

          return itemHeight;
        }}
        itemData={{
          hitCountMap,
          minHitCount,
          maxHitCount,
          isCollapsed,
          defaultItemHeight,
          toggleHitCountNumbers,
        }}
        overscanCount={50}
        width={gutterWidth}
        style={{ overflow: "inherit" }}
        ref={hitCountsListRef}
      >
        {HitCountsRow}
      </List>
    </div>,
    hitsGutter
  );
}

interface HitCountsRowProps {
  index: number;
  style?: React.CSSProperties;
  data: {
    hitCountMap: Map<number, number> | null;
    minHitCount: number;
    maxHitCount: number;
    isCollapsed: boolean;
    defaultItemHeight: number;
    toggleHitCountNumbers: () => void;
  };
}

const NUM_GRADIENT_COLORS = 3;

const HitCountsRow = ({ index, style, data }: HitCountsRowProps) => {
  const {
    hitCountMap,
    minHitCount,
    maxHitCount,
    isCollapsed,
    defaultItemHeight,
    toggleHitCountNumbers,
  } = data;

  const lineNumber = index + 1;
  const hitCount = hitCountMap?.get(lineNumber) || 0;

  // Some complex-ish math to give us a gradient color based on hit counts for this file
  let className = styles.HitsBadge0;
  let gradientIndex = NUM_GRADIENT_COLORS - 1;
  if (hitCount > 0) {
    if (minHitCount !== maxHitCount) {
      gradientIndex = Math.min(
        NUM_GRADIENT_COLORS - 1,
        Math.round(((hitCount - minHitCount) / (maxHitCount - minHitCount)) * NUM_GRADIENT_COLORS)
      );
    }
    className = styles[`HitsBadge${gradientIndex + 1}`];
  }

  let hitsLabel: React.ReactNode = " ";
  if (!isCollapsed) {
    if (hitCount > 0) {
      hitsLabel = hitCount < 1000 ? `${hitCount}` : `${(hitCount / 1000).toFixed(1)}k`;
    }
  }
  const title = `${hitCount} hits (line: ${lineNumber})`;

  return (
    <div style={style} title={title}>
      <div
        className={className}
        // Ensure that the hit color badge itself stays one line high,
        // and doesn't expand to fill lines that have print statements
        style={{ height: defaultItemHeight }}
        onClick={toggleHitCountNumbers}
      >
        {hitsLabel}
      </div>
    </div>
  );
};

function hitCountsToMap(hitCounts: HitCount[]): Map<number, number> {
  const hitCountMap: Map<number, number> = new Map();
  hitCounts.forEach(hitCount => {
    const line = hitCount.location.line;
    hitCountMap.set(line, (hitCountMap.get(line) || 0) + hitCount.hits);
  });
  return hitCountMap;
}
