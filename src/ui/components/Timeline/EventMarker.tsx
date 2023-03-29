import React from "react";

import { selectors } from "ui/reducers";
import { useAppSelector } from "ui/setup/hooks";
import { ReplayEvent } from "ui/state/app";

import Marker from "./Marker";

// TODO This component doesn't appear to be used right now?
export default function EventMarker({ event, isPrimaryHighlighted }: EventMarkerProps) {
  const zoomRegion = useAppSelector(selectors.getZoomRegion);
  const currentTime = useAppSelector(selectors.getCurrentTime);
  const overlayWidth = useAppSelector(selectors.getTimelineDimensions).width;
  return (
    <Marker
      point={event.point}
      time={event.time}
      currentTime={currentTime}
      isPrimaryHighlighted={isPrimaryHighlighted}
      zoomRegion={zoomRegion}
      overlayWidth={overlayWidth}
    />
  );
}

type EventMarkerProps = {
  event: ReplayEvent;
  isPrimaryHighlighted: boolean;
};
