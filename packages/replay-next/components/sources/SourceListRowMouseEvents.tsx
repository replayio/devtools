import { UIEvent, useContext, useLayoutEffect, useRef, useState } from "react";

import { InlineErrorBoundary } from "replay-next/components/errors/InlineErrorBoundary";
import useGetDefaultLogPointContent from "replay-next/components/sources/hooks/useGetDefaultLogPointContent";
import HoverButton from "replay-next/components/sources/HoverButton";
import useSourceContextMenu from "replay-next/components/sources/useSourceContextMenu";
import { PointsContext } from "replay-next/src/contexts/points/PointsContext";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { SourcesContext } from "replay-next/src/contexts/SourcesContext";
import { Source } from "replay-next/src/suspense/SourcesCache";
import {
  LineHitCounts,
  POINT_BEHAVIOR_DISABLED,
  POINT_BEHAVIOR_DISABLED_TEMPORARILY,
  POINT_BEHAVIOR_ENABLED,
  Point,
  PointBehavior,
} from "shared/client/types";

import styles from "./SourceListRowMouseEvents.module.css";

export function SourceListRowMouseEvents({
  lineHasLogPoint,
  lineHitCounts,
  lineNumber,
  pointBehavior,
  pointsForLine,
  source,
}: {
  lineHasLogPoint: boolean;
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
  const { currentUserInfo } = useContext(SessionContext);
  const { setCursorLocation, setHoveredLocation } = useContext(SourcesContext);

  const [isRowHovered, setIsRowHovered] = useState(false);
  const [isLineNumberHovered, setIsLineNumberHovered] = useState(false);

  const { contextMenu, onContextMenu } = useSourceContextMenu({
    lineHitCounts,
    lineNumber,
    sourceId,
    sourceUrl: sourceUrl ?? null,
  });

  const getDefaultLogPointContent = useGetDefaultLogPointContent({
    lineHitCounts,
    lineNumber,
    source,
  });

  const toggleBreakpoint = () => {
    if (!lineHasHits) {
      return;
    }

    // If there are no breakpoints on this line,
    // Clicking the breakpoint toggle should add one at the first breakable column.
    if (pointsForLine.length === 0) {
      addPoint(
        {
          badge: null,
          condition: null,
          content: getDefaultLogPointContent() || "",
        },
        {
          shouldBreak: POINT_BEHAVIOR_ENABLED,
          shouldLog: POINT_BEHAVIOR_DISABLED,
        },
        {
          column: lineHitCounts.firstBreakableColumnIndex,
          line: lineNumber,
          sourceId,
        }
      );
    } else {
      // If there are breakpoints on this line,
      // The breakable gutter marker reflects the state of the first breakpoint on the line.
      // Toggling the breakpoint on should enable breaking behavior for that point.
      // Toggling it off depends on whether the point also logs.
      // 1. If it logs and breaks, then we should disable breaking
      // 2. If it only breaks then we should delete that point (and all others on the line)
      if (lineHasLogPoint) {
        editPointBehavior(
          pointForDefaultPriority.key,
          {
            shouldBreak:
              pointBehavior?.shouldBreak === POINT_BEHAVIOR_DISABLED ||
              pointBehavior?.shouldBreak === POINT_BEHAVIOR_DISABLED_TEMPORARILY
                ? POINT_BEHAVIOR_ENABLED
                : POINT_BEHAVIOR_DISABLED,
          },
          pointForDefaultPriority.user?.id === currentUserInfo?.id
        );
      } else {
        deletePoints(...pointsForLine.map(point => point.key));
      }
    }
  };

  // onContextMenu isn't memoized because it's normally attached via React
  // (and event listeners are specially handled by the framework)
  const committedValuesRef = useRef<{
    showContextMenu: (event: UIEvent) => void;
    toggleBreakpoint: () => void;
  }>({
    showContextMenu: onContextMenu,
    toggleBreakpoint,
  });
  useLayoutEffect(() => {
    committedValuesRef.current.showContextMenu = onContextMenu;
    committedValuesRef.current.toggleBreakpoint = toggleBreakpoint;
  });

  // Use a layout effect rather than a passive effect so event listeners will be removed if the parent Offscreen is hidden
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

      const onLineNumberMouseClick = () => {
        const { toggleBreakpoint } = committedValuesRef.current;

        toggleBreakpoint();
      };

      const onLineNumberMouseEnter = () => {
        setIsLineNumberHovered(true);
      };

      const onLineNumberMouseLeave = () => {
        setIsLineNumberHovered(false);
      };

      rowElement.addEventListener("click", onRowClick);
      rowElement.addEventListener("mouseenter", onRowMouseEnter);
      rowElement.addEventListener("mouseleave", onRowMouseLeave);
      rowElement.addEventListener("contextmenu", onRowContextWrapper);

      const lineNumberElement = rowElement.querySelector(
        '[data-test-name="SourceLine-LineNumber"]'
      );
      if (lineHasHits && lineNumberElement) {
        lineNumberElement.addEventListener("click", onLineNumberMouseClick);
        lineNumberElement.addEventListener("mouseenter", onLineNumberMouseEnter);
        lineNumberElement.addEventListener("mouseleave", onLineNumberMouseLeave);
      }

      return () => {
        rowElement.removeEventListener("click", onRowClick);
        rowElement.removeEventListener("mouseenter", onRowMouseEnter);
        rowElement.removeEventListener("mouseleave", onRowMouseLeave);
        rowElement.removeEventListener("contextmenu", onRowContextWrapper);

        if (lineNumberElement) {
          lineNumberElement.removeEventListener("click", onLineNumberMouseClick);
          lineNumberElement.removeEventListener("mouseenter", onLineNumberMouseEnter);
          lineNumberElement.removeEventListener("mouseleave", onLineNumberMouseLeave);
        }
      };
    }
  }, [lineHasHits, lineNumber, setCursorLocation, setHoveredLocation, sourceId]);

  let breakPointTestState = "off";
  if (pointForDefaultPriority !== null) {
    switch (pointBehavior?.shouldBreak) {
      case POINT_BEHAVIOR_ENABLED:
        breakPointTestState = "on";
        break;
      case POINT_BEHAVIOR_DISABLED_TEMPORARILY:
        breakPointTestState = "off-temporarily";
        break;
      case POINT_BEHAVIOR_DISABLED:
      default:
        breakPointTestState = "off";
        break;
    }
  }

  const showBreakpointToggle = isLineNumberHovered || breakPointTestState !== "off";

  return (
    <>
      {showBreakpointToggle && (
        <div
          className={styles.BreakpointToggle}
          data-test-name="BreakpointToggle"
          data-test-state={breakPointTestState}
        >
          {lineNumber}
        </div>
      )}

      {!isLineNumberHovered && isRowHovered && (
        <InlineErrorBoundary name="SourceListRowMouseEvents-HoverButton" fallback={null}>
          <HoverButton
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
        </InlineErrorBoundary>
      )}

      {contextMenu}
    </>
  );
}
