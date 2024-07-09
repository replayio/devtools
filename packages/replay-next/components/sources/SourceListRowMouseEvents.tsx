import { UIEvent, useContext, useLayoutEffect, useRef, useState } from "react";

import { InlineErrorBoundary } from "replay-next/components/errors/InlineErrorBoundary";
import LogpointHoverButton from "replay-next/components/sources/LogpointHoverButton";
import { SeekHoverButtons } from "replay-next/components/sources/SeekHoverButtons";
import useSourceContextMenu from "replay-next/components/sources/useSourceContextMenu";
import { PointsContext } from "replay-next/src/contexts/points/PointsContext";
import { SourcesContext } from "replay-next/src/contexts/SourcesContext";
import { Source } from "replay-next/src/suspense/SourcesCache";
import { LineHitCounts, Point, PointBehavior } from "shared/client/types";

import styles from "./SourceListRowMouseEvents.module.css";

export function SourceListRowMouseEvents({
  lineHitCounts,
  lineNumber,
  pointBehavior,
  pointsForLine,
  source,
}: {
  lineHitCounts: LineHitCounts | null;
  lineNumber: number;
  pointBehavior: PointBehavior | null;
  pointsForLine: Point[];
  source: Source;
}) {
  const { sourceId, url: sourceUrl } = source;
  const pointForDefaultPriority = pointsForLine[0] ?? null;
  const lineHasHits = lineHitCounts != null && lineHitCounts.count > 0;

  const { addPoint, deletePoints, editPendingPointText, editPointBehavior } =
    useContext(PointsContext);
  const { setCursorLocation, setHoveredLocation } = useContext(SourcesContext);

  const [isRowHovered, setIsRowHovered] = useState(false);

  const { contextMenu, onContextMenu } = useSourceContextMenu({
    lineHitCounts,
    lineNumber,
    sourceId,
    sourceUrl: sourceUrl ?? null,
  });

  // onContextMenu isn't memoized because it's normally attached via React
  // (and event listeners are specially handled by the framework)
  const committedValuesRef = useRef<{
    showContextMenu: (event: UIEvent) => void;
  }>({
    showContextMenu: onContextMenu,
  });
  useLayoutEffect(() => {
    committedValuesRef.current.showContextMenu = onContextMenu;
  });

  // Use a layout effect rather than a passive effect so event listeners will be removed if the parent Activity is hidden
  useLayoutEffect(() => {
    const rowElement = document.querySelector(
      `[data-test-source-id="${sourceId}"] [data-test-name="SourceLine"][data-test-line-number="${lineNumber}"]`
    ) as HTMLElement;
    if (rowElement) {
      const lineIndex = lineNumber - 1;

      const setCursorLocationFromMouseEvent = (event: MouseEvent) => {
        const { target } = event;
        const htmlElement = target as HTMLElement;
        const columnIndexAttribute = htmlElement.getAttribute("data-column-index");
        const columnIndex = columnIndexAttribute ? parseInt(columnIndexAttribute) : 0;

        setCursorLocation(lineIndex, columnIndex);
      };

      const onRowClick = (event: MouseEvent) => {
        setCursorLocationFromMouseEvent(event);
      };

      const onRowContextWrapper = (event: MouseEvent) => {
        const { showContextMenu } = committedValuesRef.current;

        showContextMenu(event as any);
        setCursorLocationFromMouseEvent(event);
      };

      const onRowMouseEnter = () => {
        setIsRowHovered(true);
        setHoveredLocation(lineIndex);
      };

      const onRowMouseLeave = () => {
        setIsRowHovered(false);
        setHoveredLocation(null);
      };

      rowElement.addEventListener("click", onRowClick);
      rowElement.addEventListener("mouseenter", onRowMouseEnter);
      rowElement.addEventListener("mouseleave", onRowMouseLeave);
      rowElement.addEventListener("contextmenu", onRowContextWrapper);

      return () => {
        rowElement.removeEventListener("click", onRowClick);
        rowElement.removeEventListener("mouseenter", onRowMouseEnter);
        rowElement.removeEventListener("mouseleave", onRowMouseLeave);
        rowElement.removeEventListener("contextmenu", onRowContextWrapper);
      };
    }
  }, [lineHasHits, lineNumber, setCursorLocation, setHoveredLocation, sourceId]);

  return (
    <>
      {isRowHovered && lineHitCounts && (
        <InlineErrorBoundary name="SourceListRowMouseEvents-HoverButton" fallback={null}>
          <div className={styles.PositionLeft}>
            <div className={styles.Background}>
              <SeekHoverButtons
                lineHitCounts={lineHitCounts}
                lineNumber={lineNumber}
                source={source}
              />
            </div>
          </div>
          <div className={styles.PositionRight}>
            <div className={styles.Background}>
              <LogpointHoverButton
                addPoint={addPoint}
                deletePoints={deletePoints}
                editPendingPointText={editPendingPointText}
                editPointBehavior={editPointBehavior}
                lineHitCounts={lineHitCounts}
                lineNumber={lineNumber}
                point={pointForDefaultPriority}
                pointBehavior={pointBehavior}
                source={source}
              />
            </div>
          </div>
        </InlineErrorBoundary>
      )}

      {contextMenu}
    </>
  );
}
