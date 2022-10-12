import type { PointDescription, Location } from "@replayio/protocol";
import { MAX_POINTS_FOR_FULL_ANALYSIS } from "protocol/thread/analysis";
import { Suspense } from "react";
import { useAppSelector } from "ui/setup/hooks";
import useHitPointsForHoveredLocation from "ui/hooks/useHitPointsForHoveredLocation";
import { selectors } from "ui/reducers";

import Marker from "./Marker";

function PreviewMarkers() {
  const currentTime = useAppSelector(selectors.getCurrentTime);
  const hoveredItem = useAppSelector(selectors.getHoveredItem);
  const timelineDimensions = useAppSelector(selectors.getTimelineDimensions);
  const zoomRegion = useAppSelector(selectors.getZoomRegion);

  const [hitPoints, hitPointStatus] = useHitPointsForHoveredLocation();

  if (
    hitPointStatus === "too-many-points-to-find" ||
    hitPoints == null ||
    hitPoints.length > MAX_POINTS_FOR_FULL_ANALYSIS
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
