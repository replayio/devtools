import { FocusContext } from "@bvaughn/src/contexts/FocusContext";
import { PointsContext } from "@bvaughn/src/contexts/PointsContext";
import { SourcesContext } from "@bvaughn/src/contexts/SourcesContext";
import {
  getCachedMinMaxSourceHitCounts,
  getSourceHitCounts,
} from "@bvaughn/src/suspense/SourcesCache";
import { newSource as ProtocolSource, SourceId } from "@replayio/protocol";
import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ListOnItemsRenderedProps, VariableSizeList as List } from "react-window";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Point } from "shared/client/types";

import { HoveredState } from "./Source";
import SourceListRow, { ItemData } from "./SourceListRow";
import styles from "./SourceList.module.css";
import { SourceSearchContext } from "./SourceSearchContext";

// HACK
// We could swap this out for something that lazily measures row height.
const LINE_HEIGHT = 18;
const LINE_HEIGHT_WITH_POINT = 18 + 79;

export default function SourceList({
  height,
  htmlLines,
  setHoveredState,
  source,
  width,
}: {
  height: number;
  htmlLines: string[];
  setHoveredState: (state: HoveredState | null) => void;
  source: ProtocolSource;
  width: number;
}) {
  const { sourceId } = source;

  const [state] = useContext(SourceSearchContext);
  useLayoutEffect(() => {
    const { index, results, visible } = state;
    if (visible) {
      if (results.length > 0) {
        const lineIndex = results[index];
        const list = listRef.current;
        if (list) {
          list.scrollToItem(lineIndex);
        }
      }
    }
  }, [state]);

  const { range: focusRange } = useContext(FocusContext);
  const { addPoint, deletePoints, editPoint, points } = useContext(PointsContext);
  const client = useContext(ReplayClientContext);
  const { setVisibleLines, visibleLines } = useContext(SourcesContext);

  const hitCounts = visibleLines
    ? getSourceHitCounts(client, sourceId, visibleLines, focusRange)
    : null;

  const [minHitCount, maxHitCount] = getCachedMinMaxSourceHitCounts(sourceId, focusRange);

  const innerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<List>(null);

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

  let currentSearchResultLineIndex: number | null = null;
  if (state.visible && state.results.length) {
    currentSearchResultLineIndex = state.results[state.index]!;
  }

  const itemData = useMemo<ItemData>(
    () => ({
      addPoint,
      currentSearchResultLineIndex,
      deletePoints,
      editPoint,
      hitCounts,
      htmlLines,
      lineHeight: LINE_HEIGHT,
      maxHitCount,
      minHitCount,
      points,
      setHoveredState,
      source,
    }),
    [
      addPoint,
      currentSearchResultLineIndex,
      deletePoints,
      editPoint,
      hitCounts,
      htmlLines,
      maxHitCount,
      minHitCount,
      points,
      setHoveredState,
      source,
    ]
  );

  const getItemSize = useCallback(
    (index: number) => {
      const lineNumber = index + 1;
      const point = points.find(
        point => point.location.sourceId === sourceId && point.location.line === lineNumber
      );

      return point == null ? LINE_HEIGHT : LINE_HEIGHT_WITH_POINT;
    },
    [points, sourceId]
  );

  const maxLineWidthRef = useRef<number>(0);

  const onItemsRendered = useCallback(
    ({ visibleStartIndex, visibleStopIndex }: ListOnItemsRenderedProps) => {
      setVisibleLines(visibleStartIndex, visibleStopIndex);

      // Ensure that the list remains wide enough to horizontally scroll to the largest line we've rendered.
      // This won't quite work the same as a non-windowed solution; it's an approximation.
      const container = innerRef.current;
      if (container) {
        const maxLineWidth = maxLineWidthRef.current;
        const width = container.parentElement!.scrollWidth;
        if (width > maxLineWidth) {
          maxLineWidthRef.current = width;

          container.style.setProperty("--max-line-width", `${width}px`);
        }
      }
    },
    [setVisibleLines]
  );

  return (
    <List
      className={styles.List}
      height={height}
      innerRef={innerRef}
      itemCount={htmlLines.length}
      itemData={itemData}
      itemSize={getItemSize}
      onItemsRendered={onItemsRendered}
      ref={listRef}
      width={width}
    >
      {SourceListRow}
    </List>
  );
}
