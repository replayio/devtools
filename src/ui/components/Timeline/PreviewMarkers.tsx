import type { PointDescription } from "@replayio/protocol";
import { Suspense, useContext } from "react";

import { binarySearch } from "protocol/utils";
import ErrorBoundary from "replay-next/components/ErrorBoundary";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { SourcesContext } from "replay-next/src/contexts/SourcesContext";
import { getHitPointsForLocationSuspense } from "replay-next/src/suspense/HitPointsCache";
import { sourceHitCountsCache } from "replay-next/src/suspense/SourceHitCountsCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { toPointRange } from "shared/utils/time";
import { selectors } from "ui/reducers";
import { useAppSelector } from "ui/setup/hooks";

import Marker from "./Marker";

export default function PreviewMarkers() {
  return (
    <ErrorBoundary fallback={null}>
      <Suspense fallback={null}>
        <PreviewMarkersSuspends />
      </Suspense>
    </ErrorBoundary>
  );
}

function PreviewMarkersSuspends() {
  const currentTime = useAppSelector(selectors.getCurrentTime);
  const hoveredItem = useAppSelector(selectors.getHoveredItem);
  const timelineDimensions = useAppSelector(selectors.getTimelineDimensions);
  const zoomRegion = useAppSelector(selectors.getZoomRegion);
  const markTimeStampedPoint = useAppSelector(selectors.getMarkTimeStampedPoint);

  const replayClient = useContext(ReplayClientContext);

  const { focusedSource, hoveredLineIndex, visibleLines } = useContext(SourcesContext);
  const { range: focusRange } = useContext(FocusContext);

  const focusedSourceId = focusedSource?.sourceId ?? null;

  let firstColumnWithHitCounts = null;
  if (focusedSourceId !== null && hoveredLineIndex !== null && visibleLines !== null) {
    const hitCounts = sourceHitCountsCache.read(
      visibleLines?.start.line ?? 0,
      visibleLines?.end.line ?? 0,
      replayClient,
      focusedSourceId,
      focusRange ? toPointRange(focusRange) : null
    );
    const hitCountsForLineIndex = binarySearch(
      0,
      hitCounts.length,
      index => hoveredLineIndex + 1 - hitCounts[index][0]
    );
    const hitCountsForLine = hitCounts[hitCountsForLineIndex];
    if (hitCountsForLine && hitCountsForLine[0] === hoveredLineIndex + 1) {
      firstColumnWithHitCounts = hitCountsForLine[1].firstBreakableColumnIndex;
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

  const showHitPointMarkers =
    hitPoints != null &&
    hitPointStatus !== "too-many-points-to-run-analysis" &&
    hitPointStatus !== "too-many-points-to-find";

  return (
    <div className="preview-markers-container">
      {showHitPointMarkers &&
        hitPoints.map((point: PointDescription, index: number) => {
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

      {markTimeStampedPoint && (
        <Marker
          point={markTimeStampedPoint.point}
          time={markTimeStampedPoint.time}
          currentTime={currentTime}
          isPrimaryHighlighted={false}
          zoomRegion={zoomRegion}
          overlayWidth={timelineDimensions.width}
        />
      )}
    </div>
  );
}
