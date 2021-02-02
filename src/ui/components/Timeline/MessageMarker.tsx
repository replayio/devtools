import React from "react";
import "./MessageMarker.css";
import Marker from "./Marker";
import { HoveredPoint, ZoomRegion } from "ui/state/timeline";

export default function MessageMarker({
  message,
  currentTime,
  hoveredPoint,
  zoomRegion,
  overlayWidth,
}: {
  message: any;
  currentTime: number;
  hoveredPoint: HoveredPoint | null;
  zoomRegion: ZoomRegion;
  overlayWidth: number;
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
