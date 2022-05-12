import type { PointDescription, Location } from "@recordreplay/protocol";
import { getLocationKey } from "devtools/client/debugger/src/utils/breakpoint";
import { useSelector } from "react-redux";
import { selectors } from "ui/reducers";
import { HoveredItem } from "ui/state/timeline";
import { prefs } from "ui/utils/prefs";

import Marker from "./Marker";

export default function PreviewMarkers() {
  const currentTime = useSelector(selectors.getCurrentTime);
  const hoveredItem = useSelector(selectors.getHoveredItem);
  const pointsForHoveredLineNumber = useSelector(selectors.getPointsForHoveredLineNumber);
  const timelineDimensions = useSelector(selectors.getTimelineDimensions);
  const zoomRegion = useSelector(selectors.getZoomRegion);

  if (
    !pointsForHoveredLineNumber ||
    pointsForHoveredLineNumber.error ||
    pointsForHoveredLineNumber.data.length > prefs.maxHitsDisplayed
  ) {
    return null;
  }

  return (
    <div className="preview-markers-container">
      {pointsForHoveredLineNumber.data.map((point: PointDescription, index: number) => {
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
