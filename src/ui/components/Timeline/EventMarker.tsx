import React from "react";
import { selectors } from "ui/reducers";
import { ReplayEvent } from "ui/state/app";
import { useAppSelector } from "ui/setup/hooks";
import Marker from "./Marker";

export default function EventMarker({ event, isPrimaryHighlighted }: EventMarkerProps) {
  const zoomRegion = useAppSelector(selectors.getZoomRegion);
  const currentTime = useAppSelector(selectors.getCurrentTime);
  const overlayWidth = useAppSelector(selectors.getTimelineDimensions).width;
  return (
    <Marker
      point={event.point}
      time={event.time}
      hasFrames={false}
      currentTime={currentTime}
      isPrimaryHighlighted={isPrimaryHighlighted}
      isSecondaryHighlighted={false}
      zoomRegion={zoomRegion}
      overlayWidth={overlayWidth}
    />
  );
}

type EventMarkerProps = {
  event: ReplayEvent;
  isPrimaryHighlighted: boolean;
};
