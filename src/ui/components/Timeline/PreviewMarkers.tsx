import type { PointDescription } from "@replayio/protocol";
import { Suspense, useContext } from "react";

import { FocusContext } from "bvaughn-architecture-demo/src/contexts/FocusContext";
import { SourcesContext } from "bvaughn-architecture-demo/src/contexts/SourcesContext";
import { getHitPointsForLocationSuspense } from "bvaughn-architecture-demo/src/suspense/PointsCache";
import { getSourceHitCountsSuspense } from "bvaughn-architecture-demo/src/suspense/SourcesCache";
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

  const { focusedSourceId, hoveredLineIndex, visibleLines } = useContext(SourcesContext);
  const { range: focusRange } = useContext(FocusContext);

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
    focusedSourceId !== null && firstColumnWithHitCounts !== null && hoveredLineIndex !== null
      ? getHitPointsForLocationSuspense(
          replayClient,
          {
            sourceId: focusedSourceId,
            column: firstColumnWithHitCounts,
            line: hoveredLineIndex + 1,
          },
          null,
          focusRange
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
            hasFrames={!!point.frame}
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
