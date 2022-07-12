import type { PointDescription, Location } from "@replayio/protocol";
import { useAppSelector } from "ui/setup/hooks";
import { selectors } from "ui/reducers";
import { HoveredItem } from "ui/state/timeline";

import Marker from "./Marker";
import { getPointsForHoveredLineNumber } from "ui/reducers/breakpoints";

export default function PreviewMarkers() {
  const currentTime = useAppSelector(selectors.getCurrentTime);
  const hoveredItem = useAppSelector(selectors.getHoveredItem);
  const pointsForHoveredLineNumber = useAppSelector(getPointsForHoveredLineNumber);
  const timelineDimensions = useAppSelector(selectors.getTimelineDimensions);
  const zoomRegion = useAppSelector(selectors.getZoomRegion);

  if (
    !pointsForHoveredLineNumber ||
    pointsForHoveredLineNumber.error ||
    (pointsForHoveredLineNumber.data?.length || 0) > 200
  ) {
    return null;
  }

  return (
    <div className="preview-markers-container">
      {pointsForHoveredLineNumber.data?.map((point: PointDescription, index: number) => {
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

  return (
    hoveredItem.location.line === location.line && hoveredItem.location.column === location.column
  );
}
