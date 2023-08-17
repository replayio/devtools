import {
  CSSProperties,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { VariableSizeList as List, ListOnItemsRenderedProps } from "react-window";
import {
  useImperativeCacheValue,
  useImperativeIntervalCacheValues,
  useStreamingValue,
} from "suspense";

import { useLineHighlights } from "replay-next/components/sources/hooks/useLineHighlights";
import { useSourceListCssVariables } from "replay-next/components/sources/hooks/useSourceListCssVariables";
import { findPointForLocation } from "replay-next/components/sources/utils/points";
import { scrollToLineAndColumn } from "replay-next/components/sources/utils/scrollToLineAndColumn";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { PointsContext } from "replay-next/src/contexts/points/PointsContext";
import { SourcesContext } from "replay-next/src/contexts/SourcesContext";
import {
  BreakpointPositionsResult,
  breakpointPositionsCache,
} from "replay-next/src/suspense/BreakpointPositionsCache";
import {
  getCachedMinMaxSourceHitCounts,
  sourceHitCountsCache,
} from "replay-next/src/suspense/SourceHitCountsCache";
import { Source } from "replay-next/src/suspense/SourcesCache";
import { StreamingParser } from "replay-next/src/suspense/SyntaxParsingCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { POINT_BEHAVIOR_DISABLED, POINT_BEHAVIOR_ENABLED } from "shared/client/types";
import { toPointRange } from "shared/utils/time";

import useFontBasedListMeasurements from "./hooks/useFontBasedListMeasurements";
import SourceListRow from "./SourceListRow";
import { formatHitCount } from "./utils/formatHitCount";
import getScrollbarWidth from "./utils/getScrollbarWidth";
import styles from "./SourceList.module.css";

const NO_BREAKABLE_POSITIONS: BreakpointPositionsResult = [[], new Map()];

// In case the initial source contents request hangs,
// render a few placeholder lines of text so that the source viewer isn't empty.
const STREAMING_IN_PROGRESS_PLACEHOLDER_LINE_COUNT = 10;
const STREAMING_IN_PROGRESS_PLACEHOLDER_MAX_HIT_COUNT = 1;

export default function SourceList({
  height,
  source,
  streamingParser,
  width,
}: {
  height: number;
  source: Source;
  streamingParser: StreamingParser;
  width: number;
}) {
  const { sourceId } = source;

  const scrollbarWidth = useMemo(getScrollbarWidth, []);

  const innerRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<List>(null);

  const { range: focusRange } = useContext(FocusContext);
  const {
    pointBehaviorsForDefaultPriority: pointBehaviors,
    pointsForDefaultPriority,
    pointsForSuspense,
  } = useContext(PointsContext);
  const client = useContext(ReplayClientContext);
  const {
    focusedSource,
    markPendingFocusUpdateProcessed,
    pendingFocusUpdate,
    setVisibleLines,
    visibleLines,
  } = useContext(SourcesContext);

  const hasMountedRef = useRef<boolean>(false);

  const { lineHeight, pointPanelHeight, pointPanelWithConditionalHeight } =
    useFontBasedListMeasurements(listRef);

  const { executionPointLineHighlight, searchResultLineHighlight, viewSourceLineHighlight } =
    useLineHighlights(sourceId);

  const { data } = useStreamingValue(streamingParser);
  const lineCount = data?.lineCount;

  // Both hit counts and breakable positions are key info,
  // but neither should actually _block_ us from showing source text.
  // Fetch those in the background via the caches,
  // and re-render once that data is available.
  const { value: hitCounts } = useImperativeIntervalCacheValues(
    sourceHitCountsCache,
    visibleLines?.start.line ?? 0,
    visibleLines?.end.line ?? 0,
    client,
    sourceId,
    focusRange ? toPointRange(focusRange) : null
  );

  const { value: breakablePositionsValue = NO_BREAKABLE_POSITIONS } = useImperativeCacheValue(
    breakpointPositionsCache,
    client,
    sourceId
  );
  const [, breakablePositionsByLine] = breakablePositionsValue;

  useLayoutEffect(
    () => () => {
      // The Offscreen API cleans up layout effects when hiding views.
      // For our purposes, that's the same as an "unmount".
      hasMountedRef.current = false;
    },
    []
  );

  useEffect(() => {
    const focusedSourceId = focusedSource?.sourceId ?? null;
    const endLineIndex = focusedSource?.endLineIndex ?? null;
    const startLineIndex = focusedSource?.startLineIndex ?? null;
    const columnNumber = startLineIndex === endLineIndex ? focusedSource?.columnNumber ?? 0 : 0;

    const hasMounted = hasMountedRef.current;
    hasMountedRef.current = true;

    if (pendingFocusUpdate === false || startLineIndex === null || focusedSourceId === null) {
      return;
    } else if (sourceId !== focusedSourceId) {
      return;
    } else if (lineCount == null || lineCount < startLineIndex) {
      // Source content streams in; we may not have loaded this line yet.
      return;
    }

    const list = listRef.current;
    if (list) {
      // If this source has just been opened, try center-aligning the focused line.
      // Otherwise use react-window's "smart" scroll, which will mimic how VS Code works.
      const mode = hasMounted ? "smart" : "center";
      scrollToLineAndColumn({
        columnNumber: columnNumber != null ? columnNumber : 0,
        containerElement: outerRef.current!,
        lineNumber: startLineIndex + 1,
        list,
        mode,
      });

      // Important!
      // Don't mark the update processed until we have actually scrolled to the line.
      // The Source viewer might be suspended, loading data, and we don't want to drop the scroll action.
      markPendingFocusUpdateProcessed();
    }
  }, [focusedSource, lineCount, markPendingFocusUpdateProcessed, pendingFocusUpdate, sourceId]);

  useLayoutEffect(() => {
    // TODO
    // This is overly expensive; ideally we'd only reset this...
    // (1) if Points changed for the current source
    // (2) after the index of the point that changed
    const list = listRef.current;
    if (list) {
      list.resetAfterIndex(0);
    }
  }, [pointBehaviors, pointsForDefaultPriority]);

  const { data: streamingData, value: streamingValue } = useStreamingValue(streamingParser);

  const getItemSize = useCallback(
    (index: number) => {
      const lineNumber = index + 1;
      const point = findPointForLocation(pointsForDefaultPriority, sourceId, lineNumber);
      if (!point) {
        // If the Point has been removed by some external action,
        // e.g. the Pause Information side panel,
        // Then ignore any cached Point state.
        return lineHeight;
      }

      const pointBehavior = pointBehaviors[point.key];
      // This Point might have been restored by a previous session.
      // In this case we should use its persisted values.
      // Else by default, shared print statements should be shown.
      // Points that have no content (breakpoints) should be hidden by default though.
      const shouldLog =
        pointBehavior?.shouldLog ??
        (point.content ? POINT_BEHAVIOR_ENABLED : POINT_BEHAVIOR_DISABLED);
      if (shouldLog !== POINT_BEHAVIOR_DISABLED) {
        if (point.condition !== null) {
          return lineHeight + pointPanelWithConditionalHeight;
        } else {
          return lineHeight + pointPanelHeight;
        }
      }

      return lineHeight;
    },
    [
      lineHeight,
      pointBehaviors,
      pointPanelHeight,
      pointPanelWithConditionalHeight,
      pointsForDefaultPriority,
      sourceId,
    ]
  );

  const longestLineWidthRef = useRef<number>(0);

  const onItemsRendered = useCallback(
    ({ visibleStartIndex, visibleStopIndex }: ListOnItemsRenderedProps) => {
      setVisibleLines(visibleStartIndex, visibleStopIndex);

      // Ensure that the list remains wide enough to horizontally scroll to the largest line we've rendered.
      // This won't quite work the same as a non-windowed solution; it's an approximation.
      const container = innerRef.current;
      if (container) {
        let longestLineWidth = 0;
        for (let index = 0; index < container.children.length; index++) {
          const child = container.children[index];
          longestLineWidth = Math.max(longestLineWidth, child.clientWidth);
        }

        if (longestLineWidth > longestLineWidthRef.current) {
          longestLineWidthRef.current = longestLineWidth;

          container.style.setProperty("--longest-line-width", `${longestLineWidth}px`);
        }
      }
    },
    [setVisibleLines]
  );

  const [
    minHitCount = STREAMING_IN_PROGRESS_PLACEHOLDER_MAX_HIT_COUNT,
    maxHitCount = STREAMING_IN_PROGRESS_PLACEHOLDER_MAX_HIT_COUNT,
  ] = getCachedMinMaxSourceHitCounts(sourceId, focusRange);

  const maxLineIndexStringLength = `${lineCount ?? STREAMING_IN_PROGRESS_PLACEHOLDER_LINE_COUNT}`
    .length;
  const maxHitCountStringLength = maxHitCount != null ? `${formatHitCount(maxHitCount)}`.length : 0;

  useSourceListCssVariables({
    elementRef: outerRef,
    maxHitCountStringLength,
    maxLineIndexStringLength,
  });

  // Note that we don't useMemo for this value
  // because scrolling causes hit counts and max hit count values to change
  // which mostly bypasses the memoization anyway
  const itemData = {
    breakablePositionsByLine,
    executionPointLineHighlight,
    hitCounts,
    lineHeight,
    maxHitCount,
    minHitCount,
    plainText: streamingData?.plainText ?? null,
    parsedTokens: streamingValue ?? null,
    pointBehaviors,
    pointsForDefaultPriority,
    pointsForSuspense,
    searchResultLineHighlight,
    source,
    viewSourceLineHighlight,
  };

  return (
    <>
      <List
        className={styles.List}
        estimatedItemSize={lineHeight}
        height={height}
        innerRef={innerRef}
        itemCount={lineCount ?? STREAMING_IN_PROGRESS_PLACEHOLDER_LINE_COUNT}
        itemData={itemData}
        itemSize={getItemSize}
        onItemsRendered={onItemsRendered}
        outerRef={outerRef}
        ref={listRef}
        style={
          {
            "--hit-count-size": `${maxHitCountStringLength}ch`,
            "--line-height": `${lineHeight}px`,
            "--line-number-size": `${maxLineIndexStringLength + 1}ch`,
            "--list-width": `${width - scrollbarWidth}px`,
            "--point-panel-height": `${pointPanelHeight}px`,
            "--point-panel-with-conditional-height": `${pointPanelWithConditionalHeight}px`,
          } as CSSProperties
        }
        useIsScrolling
        width={width}
      >
        {SourceListRow}
      </List>
    </>
  );
}
