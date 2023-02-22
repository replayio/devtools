import type { PointDescription } from "@replayio/protocol";
import { Suspense, useContext } from "react";

import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { SourcesContext } from "replay-next/src/contexts/SourcesContext";
import { getHitPointsForLocationSuspense } from "replay-next/src/suspense/HitPointsCache";
import { getSourceHitCountsSuspense } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { selectors } from "ui/reducers";
import { useAppSelector } from "ui/setup/hooks";

import Marker from "./Marker";

function PreviewMarkers() {
  const currentTime = useAppSelector(selectors.getCurrentTime);
  const hoveredItem = useAppSelector(selectors.getHoveredItem);
  const timelineDimensions = useAppSelector(selectors.getTimelineDimensions);
  const zoomRegion = useAppSelector(selectors.getZoomRegion);

  const replayClient = useContext(ReplayClientContext);

  const { focusedSource, hoveredLineIndex, visibleLines } = useContext(SourcesContext);
  const { range: focusRange } = useContext(FocusContext);

  const focusedSourceId = focusedSource?.sourceId ?? null;

  let firstColumnWithHitCounts = null;
  if (focusedSourceId !== null && hoveredLineIndex !== null && visibleLines !== null) {
    const hitCounts = getSourceHitCountsSuspense(
      replayClient,
      focusedSourceId,
      visibleLines,
      focusRange
    );
    const hitCountsForLine = hitCounts.get(hoveredLineIndex + 1)!;
    if (hitCountsForLine) {
      firstColumnWithHitCounts = hitCountsForLine.firstBreakableColumnIndex;
    }
  }

  const [hitPoints, hitPointStatus] =
    focusRange &&
    focusedSourceId !== null &&
    firstColumnWithHitCounts !== null &&
    hoveredLineIndex !== null
      ? getHitPointsForLocationSuspense(
          replayClient,
          {
            sourceId: focusedSourceId,
            column: firstColumnWithHitCounts,
            line: hoveredLineIndex + 1,
          },
          null,
          { begin: focusRange.begin.point, end: focusRange.end.point }
        )
      : [null, null];

  if (
    hitPointStatus === "too-many-points-to-run-analysis" ||
    hitPointStatus === "too-many-points-to-find" ||
    hitPoints == null
  ) {
    return null;
  }

  return (
    <div className="preview-markers-container">
      {hitPoints.map((point: PointDescription, index: number) => {
        const isPrimaryHighlighted = hoveredItem?.point === point.point;

        return (
          <Marker
            key={index}
            point={point.point}
            time={point.time}
            location={point.frame?.[0]}
            currentTime={currentTime}
            isPrimaryHighlighted={isPrimaryHighlighted}
            zoomRegion={zoomRegion}
            overlayWidth={timelineDimensions.width}
          />
        );
      })}
    </div>
  );
}

export default function ToggleWidgetButtonSuspenseWrapper() {
  return (
    <Suspense fallback={null}>
      <PreviewMarkers />
    </Suspense>
  );
}
