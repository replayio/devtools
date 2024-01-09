import type { PointDescription, SourceId, TimeStampedPoint } from "@replayio/protocol";
import { Suspense, useContext } from "react";

import { binarySearch } from "protocol/utils";
import { InlineErrorBoundary } from "replay-next/components/errors/InlineErrorBoundary";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { SourcesContext } from "replay-next/src/contexts/SourcesContext";
import { useDebounce } from "replay-next/src/hooks/useDebounce";
import { hitPointsForLocationCache } from "replay-next/src/suspense/HitPointsCache";
import { sourceHitCountsCache } from "replay-next/src/suspense/SourceHitCountsCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { HitPointStatus, SourceLocationRange } from "shared/client/types";
import { toPointRange } from "shared/utils/time";
import { selectors } from "ui/reducers";
import { useAppSelector } from "ui/setup/hooks";

import Marker from "./Marker";

export default function PreviewMarkers() {
  const { focusedSource, hoveredLineIndex, visibleLines } = useContext(SourcesContext);

  const sourceId = focusedSource?.sourceId ?? null;

  // Avoid sending a lot of protocol requests by debouncing a little while the user is mousing over lines
  const debouncedHoveredLineIndex = useDebounce(hoveredLineIndex, 100);

  if (debouncedHoveredLineIndex == null || sourceId == null || visibleLines == null) {
    return <div className="preview-markers-container" />;
  }

  return (
    <InlineErrorBoundary fallback={null} name="PreviewMarkers">
      <Suspense fallback={null}>
        <PreviewMarkersSuspends
          lineNumber={debouncedHoveredLineIndex + 1}
          sourceId={sourceId}
          visibleLines={visibleLines}
        />
      </Suspense>
    </InlineErrorBoundary>
  );
}

function PreviewMarkersSuspends({
  lineNumber,
  sourceId,
  visibleLines,
}: {
  lineNumber: number;
  sourceId: SourceId;
  visibleLines: SourceLocationRange;
}) {
  const currentTime = useAppSelector(selectors.getCurrentTime);
  const hoveredItem = useAppSelector(selectors.getHoveredItem);
  const timelineDimensions = useAppSelector(selectors.getTimelineDimensions);
  const zoomRegion = useAppSelector(selectors.getZoomRegion);
  const markTimeStampedPoint = useAppSelector(selectors.getMarkTimeStampedPoint);

  const { endpoint } = useContext(SessionContext);
  const replayClient = useContext(ReplayClientContext);

  const { rangeForSuspense: focusRange } = useContext(FocusContext);

  const hitCounts = sourceHitCountsCache.read(
    visibleLines.start.line ?? 0,
    visibleLines.end.line ?? 0,
    replayClient,
    sourceId,
    focusRange ? toPointRange(focusRange) : null
  );
  const hitCountsForLineIndex = binarySearch(
    0,
    hitCounts.length,
    index => lineNumber - hitCounts[index][0]
  );

  let firstColumnHitCounts = undefined;
  let firstColumnWithHitCounts = undefined;
  const hitCountsForLine = hitCounts[hitCountsForLineIndex];
  if (hitCountsForLine && hitCountsForLine[0] === lineNumber) {
    firstColumnHitCounts = hitCountsForLine[1].count;
    firstColumnWithHitCounts = hitCountsForLine[1].firstBreakableColumnIndex;
  }

  let hitPoints: TimeStampedPoint[] = [];
  let hitPointStatus: HitPointStatus | null = null;
  if (
    firstColumnWithHitCounts != null &&
    firstColumnHitCounts != null &&
    firstColumnHitCounts > 0
  ) {
    const tuple = hitPointsForLocationCache.read(
      replayClient,
      {
        begin: focusRange ? focusRange.begin.point : "0",
        end: focusRange ? focusRange.end.point : endpoint,
      },
      {
        column: firstColumnWithHitCounts,
        line: lineNumber,
        sourceId,
      },
      null
    );

    hitPoints = tuple[0];
    hitPointStatus = tuple[1];
  }

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
