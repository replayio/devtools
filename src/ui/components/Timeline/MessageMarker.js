import React from "react";
import "./MessageMarker.css";
import Marker from "./Marker.js";

export default function MessageMarker({
  message,
  currentTime,
  hoveredPoint,
  zoomRegion,
  overlayWidth,
}) {
  const { executionPoint, executionPointTime, frame, pauseId, executionPointHasFrames } = message;

  return (
    <Marker
      point={executionPoint}
      time={executionPointTime}
      hasFrames={executionPointHasFrames}
      location={frame}
      pauseId={pauseId}
      currentTime={currentTime}
      hoveredPoint={hoveredPoint}
      zoomRegion={zoomRegion}
      overlayWidth={overlayWidth}
    />
  );
}
