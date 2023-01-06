import { newSource as ProtocolSource } from "@replayio/protocol";
import debounce from "lodash/debounce";
import {
  CSSProperties,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import { VariableSizeList as List, ListOnItemsRenderedProps } from "react-window";

import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { PointsContext } from "replay-next/src/contexts/PointsContext";
import { SourcesContext } from "replay-next/src/contexts/SourcesContext";
import useLocalStorage from "replay-next/src/hooks/useLocalStorage";
import {
  StreamingSourceContents,
  getBreakpointPositionsSuspense,
  getCachedMinMaxSourceHitCounts,
  getSourceHitCountsSuspense,
} from "replay-next/src/suspense/SourcesCache";
import { StreamingParser } from "replay-next/src/suspense/SyntaxParsingCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Point } from "shared/client/types";

import useFontBasedListMeasurents from "./hooks/useFontBasedListMeasurents";
import SourceListRow, { ItemData } from "./SourceListRow";
import { formatHitCount } from "./utils/formatHitCount";
import getScrollbarWidth from "./utils/getScrollbarWidth";
import { findPointForLocation } from "./utils/points";
import styles from "./SourceList.module.css";

export default function SourceList({
  height,
  showColumnBreakpoints,
  source,
  streamingParser,
  streamingSourceContents,
  width,
}: {
  height: number;
  showColumnBreakpoints: boolean;
  source: ProtocolSource;
  streamingParser: StreamingParser;
  streamingSourceContents: StreamingSourceContents;
  width: number;
}) {
  const { sourceId } = source;

  const scrollbarWidth = useMemo(getScrollbarWidth, []);

  const innerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<List>(null);

  const { range: focusRange } = useContext(FocusContext);
  const { addPoint, deletePoints, editPoint, points } = useContext(PointsContext);
  const client = useContext(ReplayClientContext);
  const {
    focusedSource,
    markPendingFocusUpdateProcessed,
    pendingFocusUpdate,
    setHoveredLocation,
    setVisibleLines,
    visibleLines,
  } = useContext(SourcesContext);

  const {
    conditionalPointPanelHeight,
    pointPanelHeight,
    lineHeight,
    lineHeightWithConditionalPoint,
    lineHeightWithPoint,
  } = useFontBasedListMeasurents(listRef);

  const lineCount = useSyncExternalStore(
    streamingSourceContents.subscribe,
    () => streamingSourceContents.lineCount,
    () => streamingSourceContents.lineCount
  );

  useEffect(() => {
    const focusedSourceId = focusedSource?.sourceId ?? null;
    const startLineIndex = focusedSource?.startLineIndex ?? null;

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
      list.scrollToItem(startLineIndex, "smart");

      // Important!
      // Don't mark the update processed until we have actually scrolled to the line.
      // The Source viewer might be suspended, loading data, and we don't want to drop the scroll action.
      markPendingFocusUpdateProcessed();
    }
  }, [focusedSource, lineCount, markPendingFocusUpdateProcessed, pendingFocusUpdate, sourceId]);

  const togglesLocalStorageKey = `Replay:ShowHitCounts`;
  const [showHitCounts] = useLocalStorage<boolean>(togglesLocalStorageKey, true);

  // Note that getSourceHitCountsSuspense also suspends on getBreakpointPositions*
  const [_, breakablePositionsByLine] = getBreakpointPositionsSuspense(client, sourceId);

  const hitCounts = visibleLines
    ? getSourceHitCountsSuspense(client, sourceId, visibleLines, focusRange)
    : null;

  const [minHitCount, maxHitCount] = getCachedMinMaxSourceHitCounts(sourceId, focusRange);

  const prevPointsRef = useRef<Point[]>([]);
  useLayoutEffect(() => {
    const list = listRef.current;
    if (list) {
      const prevPoints = prevPointsRef.current;
      // HACK
      // This is a really lazy way of invalidating cached measurements;
      // It's better than invalidating from index 0, but it's still likely to be more work than necessary.
      const prevPointsIndex =
        prevPoints.length > 0 ? prevPoints[0].location.line - 1 : Number.MAX_SAFE_INTEGER;
      const nextPointsIndex =
        points.length > 0 ? points[0].location.line - 1 : Number.MAX_SAFE_INTEGER;
      const index = Math.min(prevPointsIndex, nextPointsIndex);
      list.resetAfterIndex(index);
    }

    prevPointsRef.current = points;
  }, [points]);

  // React's rules-of-hooks doesn't like useCallback(debounce(...))
  // It will error with a false positive: seCallback received a function whose dependencies are unknown
  const onLineMouseLeaveDebounced = useMemo(
    () =>
      debounce(() => {
        setHoveredLocation(null, null);
      }, 50),
    [setHoveredLocation]
  );

  const onLineMouseEnter = useCallback(
    (lineIndex: number, lineNode: HTMLElement) => {
      onLineMouseLeaveDebounced.cancel();

      setHoveredLocation(lineIndex, lineNode);
    },
    [onLineMouseLeaveDebounced, setHoveredLocation]
  );

  const itemData = useMemo<ItemData>(
    () => ({
      addPoint,
      breakablePositionsByLine,
      deletePoints,
      editPoint,
      hitCounts,
      lineHeight,
      maxHitCount,
      minHitCount,
      onLineMouseEnter,
      onLineMouseLeave: onLineMouseLeaveDebounced,
      points,
      showColumnBreakpoints,
      showHitCounts,
      source,
      streamingParser,
    }),
    [
      addPoint,
      breakablePositionsByLine,
      deletePoints,
      editPoint,
      hitCounts,
      lineHeight,
      maxHitCount,
      minHitCount,
      onLineMouseEnter,
      onLineMouseLeaveDebounced,
      points,
      showHitCounts,
      showColumnBreakpoints,
      source,
      streamingParser,
    ]
  );

  const getItemSize = useCallback(
    (index: number) => {
      const lineNumber = index + 1;
      const point = findPointForLocation(points, sourceId, lineNumber);
      if (point === null || (!point.shouldLog && !point.shouldShowPointPanel)) {
        return lineHeight;
      } else if (point.condition !== null) {
        return lineHeightWithConditionalPoint;
      } else {
        return lineHeightWithPoint;
      }
    },
    [lineHeight, lineHeightWithConditionalPoint, lineHeightWithPoint, points, sourceId]
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

  const maxLineIndexStringLength = `${lineCount}`.length;
  const maxHitCountStringLength =
    showHitCounts && maxHitCount !== null ? `${formatHitCount(maxHitCount)}`.length : 0;

  const widthMinusScrollbar = width - scrollbarWidth;

  const style = {
    "--conditional-point-panel-height": `${conditionalPointPanelHeight}px`,
    "--hit-count-size": `${maxHitCountStringLength}ch`,
    "--line-height": `${lineHeight}px`,
    "--line-number-size": `${maxLineIndexStringLength + 1}ch`,
    "--list-width": `${widthMinusScrollbar}px`,
    "--point-panel-height": `${pointPanelHeight}px`,
  };

  return (
    <List
      className={styles.List}
      estimatedItemSize={lineHeight}
      height={height}
      innerRef={innerRef}
      itemCount={lineCount || 0}
      itemData={itemData}
      itemSize={getItemSize}
      onItemsRendered={onItemsRendered}
      ref={listRef}
      style={style as CSSProperties}
      width={width}
    >
      {SourceListRow}
    </List>
  );
}
