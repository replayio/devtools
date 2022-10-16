import { FocusContext } from "@bvaughn/src/contexts/FocusContext";
import { PointsContext } from "@bvaughn/src/contexts/PointsContext";
import { SourcesContext } from "@bvaughn/src/contexts/SourcesContext";
import {
  getCachedMinMaxSourceHitCounts,
  getSourceHitCounts,
} from "@bvaughn/src/suspense/SourcesCache";
import { newSource as ProtocolSource, SourceId } from "@replayio/protocol";
import { useCallback, useContext, useLayoutEffect, useMemo, useRef } from "react";
import { ListOnItemsRenderedProps, VariableSizeList as List } from "react-window";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Point } from "shared/client/types";

import { HoveredState } from "./Source";
import SourceListRow, { ItemData } from "./SourceListRow";

// HACK
// We could swap this out for something that lazily measures row height.
const LINE_HEIGHT = 18;
const LINE_HEIGHT_WITH_POINT = 18 + 79;

export default function SourceList({
  height,
  htmlLines,
  setHoveredState,
  source,
  sourceId,
  width,
}: {
  height: number;
  htmlLines: string[];
  setHoveredState: (state: HoveredState | null) => void;
  source: ProtocolSource;
  sourceId: SourceId;
  width: number;
}) {
  const { range: focusRange } = useContext(FocusContext);
  const { addPoint, deletePoints, editPoint, points } = useContext(PointsContext);
  const client = useContext(ReplayClientContext);
  const { setVisibleLines, visibleLines } = useContext(SourcesContext);

  const hitCounts = visibleLines
    ? getSourceHitCounts(client, sourceId, visibleLines, focusRange)
    : null;

  const [minHitCount, maxHitCount] = getCachedMinMaxSourceHitCounts(sourceId, focusRange);

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

  const itemData = useMemo<ItemData>(
    () => ({
      addPoint,
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

  const onItemsRendered = useCallback(
    ({ visibleStartIndex, visibleStopIndex }: ListOnItemsRenderedProps) => {
      setVisibleLines(visibleStartIndex, visibleStopIndex);
    },
    [setVisibleLines]
  );

  return (
    <List
      height={height}
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
