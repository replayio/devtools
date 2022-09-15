import type { PointDescription, Location } from "@replayio/protocol";
import { getLocationKey } from "devtools/client/debugger/src/utils/breakpoint";
import { MAX_POINTS_FOR_FULL_ANALYSIS } from "protocol/thread/analysis";
import { useAppSelector } from "ui/setup/hooks";
import { selectors } from "ui/reducers";
import { HoveredItem } from "ui/state/timeline";

import Marker from "./Marker";
import useHitPointsForHoveredLocation from "ui/hooks/useHitPointsForHoveredLocation";
import { Suspense } from "react";

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
        const isSecondaryHighlighted = getIsSecondaryHighlighted(hoveredItem, point.frame?.[0]);

        return (
          <Marker
            key={index}
            point={point.point}
            time={point.time}
            hasFrames={!!point.frame}
            location={point.frame?.[0]}
            currentTime={currentTime}
            isPrimaryHighlighted={isPrimaryHighlighted}
            isSecondaryHighlighted={isSecondaryHighlighted}
            zoomRegion={zoomRegion}
            overlayWidth={timelineDimensions.width}
          />
        );
      })}
    </div>
  );
}

function getIsSecondaryHighlighted(
  hoveredItem: HoveredItem | null,
  location: Location | undefined
): boolean {
  if (hoveredItem?.target == "console" || !location || !hoveredItem?.location) {
    return false;
  }

  return getLocationKey(hoveredItem.location) == getLocationKey(location);
}

export default function ToggleWidgetButtonSuspenseWrapper() {
  return (
    <Suspense fallback={null}>
      <PreviewMarkers />
    </Suspense>
  );
}
