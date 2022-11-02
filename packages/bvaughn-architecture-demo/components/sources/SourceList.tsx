import { FocusContext } from "@bvaughn/src/contexts/FocusContext";
import { PointsContext } from "@bvaughn/src/contexts/PointsContext";
import { SourcesContext } from "@bvaughn/src/contexts/SourcesContext";
import { StreamingParser } from "@bvaughn/src/suspense/SyntaxParsingCache";
import useLocalStorage from "@bvaughn/src/hooks/useLocalStorage";
import {
  getCachedMinMaxSourceHitCounts,
  getSourceHitCountsSuspense,
  getStreamingSourceContents,
  StreamingSourceContents,
} from "@bvaughn/src/suspense/SourcesCache";
import { newSource as ProtocolSource } from "@replayio/protocol";
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
import { ListOnItemsRenderedProps, VariableSizeList as List } from "react-window";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Point } from "shared/client/types";

import { formatHitCount } from "./utils/formatHitCount";
import SourceListRow, { ItemData } from "./SourceListRow";
import styles from "./SourceList.module.css";
import { SourceSearchContext } from "./SourceSearchContext";
import { findPointForLocation } from "./utils/points";
import getScrollbarWidth from "./utils/getScrollbarWidth";
import useFontBasedListMeasurents from "./hooks/useFontBasedListMeasurents";

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
    focusedLineNumber,
    focusedSourceId,
    markPendingFocusUpdateProcessed,
    pendingFocusUpdate,
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
    if (pendingFocusUpdate === null || focusedLineNumber === null || focusedSourceId === null) {
      return;
    }

    const list = listRef.current;
    if (list) {
      const lineIndex = focusedLineNumber - 1;
      list.scrollToItem(lineIndex, "smart");

      // Important!
      // Don't mark the update processed until we have actually scrolled to the line.
      // The Source viewer might be suspended, loading data, and we don't want to drop the scroll action.
      markPendingFocusUpdateProcessed();
    }
  }, [
    focusedLineNumber,
    focusedSourceId,
    markPendingFocusUpdateProcessed,
    pendingFocusUpdate,
    sourceId,
  ]);

  const [sourceSearchState, sourceSearchActions] = useContext(SourceSearchContext);
  useLayoutEffect(() => {
    const { pendingUpdateForScope, enabled, index, results } = sourceSearchState;
    if (pendingUpdateForScope === null || pendingUpdateForScope !== sourceId) {
      return;
    }

    if (enabled) {
      if (results.length > 0) {
        const lineIndex = results[index];
        const list = listRef.current;
        if (list) {
          list.scrollToItem(lineIndex, "smart");
        }
      }

      sourceSearchActions.markUpdateProcessed();
    }
  }, [sourceId, sourceSearchActions, sourceSearchState]);

  const togglesLocalStorageKey = `Replay:ShowHitCounts`;
  const [showHitCounts, setShowHitCounts] = useLocalStorage<boolean>(togglesLocalStorageKey, true);

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

  const itemData = useMemo<ItemData>(
    () => ({
      addPoint,
      deletePoints,
      editPoint,
      hitCounts,
      lineHeight,
      maxHitCount,
      minHitCount,
      points,
      setShowHitCounts,
      showColumnBreakpoints,
      showHitCounts,
      source,
      streamingParser,
    }),
    [
      addPoint,
      deletePoints,
      editPoint,
      hitCounts,
      lineHeight,
      maxHitCount,
      minHitCount,
      points,
      showHitCounts,
      showColumnBreakpoints,
      setShowHitCounts,
      source,
      streamingParser,
    ]
  );

  const getItemSize = useCallback(
    (index: number) => {
      const lineNumber = index + 1;
      const point = findPointForLocation(points, sourceId, lineNumber);
      if (point === null || !point.shouldLog) {
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

  const maxLineNumberStringLength = `${lineCount}`.length;
  const maxHitCountStringLength =
    showHitCounts && maxHitCount !== null ? `${formatHitCount(maxHitCount)}`.length : 0;

  const widthMinusScrollbar = width - scrollbarWidth;

  const style = {
    "--conditional-point-panel-height": `${conditionalPointPanelHeight}px`,
    "--hit-count-size": `${maxHitCountStringLength}ch`,
    "--line-height": `${lineHeight}px`,
    "--line-number-size": `${maxLineNumberStringLength + 1}ch`,
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
