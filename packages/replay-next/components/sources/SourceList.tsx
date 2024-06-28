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
import { useImperativeCacheValue, useStreamingValue } from "suspense";

import useGetItemSize from "replay-next/components/sources/hooks/useGetItemSize";
import { useLineHighlights } from "replay-next/components/sources/hooks/useLineHighlights";
import { useMaxStringLengths } from "replay-next/components/sources/hooks/useMaxStringLengths";
import { useSourceListCssVariables } from "replay-next/components/sources/hooks/useSourceListCssVariables";
import { LogPointPanelDoubleBuffer } from "replay-next/components/sources/log-point-panel/LogPointPanelDoubleBuffer";
import { scrollToLineAndColumn } from "replay-next/components/sources/utils/scrollToLineAndColumn";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { PointsContext } from "replay-next/src/contexts/points/PointsContext";
import { SourcesContext } from "replay-next/src/contexts/SourcesContext";
import {
  BreakpointPositionsByLine,
  breakpointPositionsByLineCache,
} from "replay-next/src/suspense/BreakpointPositionsCache";
import { getCachedMinMaxSourceHitCounts } from "replay-next/src/suspense/SourceHitCountsCache";
import { Source } from "replay-next/src/suspense/SourcesCache";
import { StreamingParser } from "replay-next/src/suspense/SyntaxParsingCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import SourceListRow from "./SourceListRow";
import getScrollbarWidth from "./utils/getScrollbarWidth";
import styles from "./SourceList.module.css";

const NO_BREAKABLE_POSITIONS: BreakpointPositionsByLine = new Map();

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
    pointsForSuspense,
    pointsWithPendingEdits,
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

  const { executionPointLineHighlight, searchResultLineHighlight, viewSourceLineHighlight } =
    useLineHighlights(sourceId);

  const { data } = useStreamingValue(streamingParser);
  const lineCount = data?.lineCount;

  const { value: breakablePositionsByLine = NO_BREAKABLE_POSITIONS } = useImperativeCacheValue(
    breakpointPositionsByLineCache,
    client,
    sourceId,
    visibleLines?.start.line ?? 0,
    visibleLines?.end.line ?? 0
  );

  useLayoutEffect(
    () => () => {
      // The Activity API cleans up layout effects when hiding views.
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

  const { data: streamingData, value: streamingValue } = useStreamingValue(streamingParser);

  const [getItemSize, lineHeight] = useGetItemSize({
    availableWidth: width - scrollbarWidth,
    pointBehaviors,
    pointsWithPendingEdits,
    sourceId,
  });

  useLayoutEffect(() => {
    // TODO
    // This is overly expensive; ideally we'd only reset this...
    // (1) if Points changed for the current source
    // (2) after the index of the point that changed
    const list = listRef.current;
    if (list) {
      list.resetAfterIndex(0);
    }
  }, [getItemSize]);

  const [minHitCount, maxHitCount] = getCachedMinMaxSourceHitCounts(sourceId, focusRange);

  const { maxLineIndexStringLength, maxHitCountStringLength } = useMaxStringLengths({
    lineCount: lineCount ?? STREAMING_IN_PROGRESS_PLACEHOLDER_LINE_COUNT,
    maxHitCount,
    maxHitCountDefault: STREAMING_IN_PROGRESS_PLACEHOLDER_MAX_HIT_COUNT,
  });

  const { cssVariablesRef, itemsRenderedCallback } = useSourceListCssVariables({
    elementRef: outerRef,
    maxHitCountStringLength,
    maxLineIndexStringLength,
  });

  const onItemsRendered = useCallback(
    ({ visibleStartIndex, visibleStopIndex }: ListOnItemsRenderedProps) => {
      setVisibleLines(visibleStartIndex, visibleStopIndex);

      itemsRenderedCallback();
    },
    [itemsRenderedCallback, setVisibleLines]
  );

  // Note that we don't useMemo for this value
  // because scrolling causes hit counts and max hit count values to change
  // which mostly bypasses the memoization anyway
  const itemData = {
    breakablePositionsByLine,
    executionPointLineHighlight,
    lineHeight,
    maxHitCount: maxHitCount ?? STREAMING_IN_PROGRESS_PLACEHOLDER_MAX_HIT_COUNT,
    minHitCount: minHitCount ?? 0,
    plainText: streamingData?.plainText ?? null,
    parsedTokens: streamingValue ?? null,
    pointBehaviors,
    pointsForSuspense,
    pointsWithPendingEdits,
    searchResultLineHighlight,
    source,
    viewSourceLineHighlight,
  };

  return (
    <div
      style={
        {
          "--hit-count-size": `${maxHitCountStringLength}ch`,
          "--line-height": `${lineHeight}px`,
          "--line-number-size": `${maxLineIndexStringLength + 1}ch`,
          "--list-width": `${width - scrollbarWidth}px`,
          ...cssVariablesRef.current,
        } as CSSProperties
      }
    >
      <LogPointPanelDoubleBuffer sourceId={sourceId} />
      <List
        className={styles.List}
        data-test-name="SourceList"
        estimatedItemSize={lineHeight}
        height={height}
        innerRef={innerRef}
        itemCount={lineCount ?? STREAMING_IN_PROGRESS_PLACEHOLDER_LINE_COUNT}
        itemData={itemData}
        itemSize={getItemSize}
        onItemsRendered={onItemsRendered}
        outerRef={outerRef}
        ref={listRef}
        useIsScrolling
        width={width}
      >
        {SourceListRow}
      </List>
    </div>
  );
}
