import React from "react";

import { selectors } from "ui/reducers";
import { useAppSelector } from "ui/setup/hooks";

import Marker from "./Marker";

export default function MessageMarker({ message, isPrimaryHighlighted }: MessageMarkerProps) {
  const { executionPoint, executionPointTime, frame, pauseId, executionPointHasFrames } = message;

  const zoomRegion = useAppSelector(selectors.getZoomRegion);
  const currentTime = useAppSelector(selectors.getCurrentTime);
  const overlayWidth = useAppSelector(selectors.getTimelineDimensions).width;

  return (
    <Marker
      point={executionPoint}
      time={executionPointTime}
      location={frame}
      pauseId={pauseId}
      currentTime={currentTime}
      isPrimaryHighlighted={isPrimaryHighlighted}
      zoomRegion={zoomRegion}
      overlayWidth={overlayWidth}
    />
  );
}

type MessageMarkerProps = {
  message: any;
  isPrimaryHighlighted: boolean;
};
