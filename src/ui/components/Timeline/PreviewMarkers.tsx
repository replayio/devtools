import type { PointDescription } from "@replayio/protocol";
import { FocusContext } from "bvaughn-architecture-demo/src/contexts/FocusContext";
import { SourcesContext } from "bvaughn-architecture-demo/src/contexts/SourcesContext";
import { getHitPointsForLocation } from "bvaughn-architecture-demo/src/suspense/PointsCache";
import { getSourceHitCounts } from "bvaughn-architecture-demo/src/suspense/SourcesCache";
import { Suspense, useContext } from "react";
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
    const hitCounts = getSourceHitCounts(replayClient, focusedSourceId, visibleLines, focusRange);
    const hitCountsForLine = hitCounts.get(hoveredLineIndex)!;
    if (hitCountsForLine) {
      const first = hitCountsForLine.columnHits[0];
      if (first) {
        firstColumnWithHitCounts = first.location.column;
      }
    }
  }

  const [hitPoints, hitPointStatus] =
    focusedSourceId !== null && firstColumnWithHitCounts !== null && hoveredLineIndex !== null
      ? getHitPointsForLocation(
          replayClient,
          {
            sourceId: focusedSourceId,
            column: firstColumnWithHitCounts,
            line: hoveredLineIndex,
          },
          null,
          focusRange
        )
      : [null, null];

  if (hitPointStatus === "too-many-points-to-find" || hitPoints == null) {
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
