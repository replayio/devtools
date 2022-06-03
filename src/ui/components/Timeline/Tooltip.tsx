import React from "react";
import { useSelector } from "react-redux";
import { getNonLoadingTimeRanges } from "ui/reducers/app";
import { getHoverTime, getShowFocusModeControls, getZoomRegion } from "ui/reducers/timeline";
import { getVisiblePosition } from "ui/utils/timeline";

const getTimestamp = (time?: number) => {
  const date = new Date(time || 0);
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const minutes = date.getMinutes();

  return `${minutes}:${seconds}`;
};

export default function Tooltip({ timelineWidth }: { timelineWidth: number }) {
  const hoverTime = useSelector(getHoverTime);
  const zoomRegion = useSelector(getZoomRegion);
  const showFocusModeControls = useSelector(getShowFocusModeControls);
  const nonLoadingRegion = useSelector(getNonLoadingTimeRanges);
  const shouldHideTooltip = !hoverTime || showFocusModeControls;

  if (shouldHideTooltip) {
    return null;
  }

  let offset = getVisiblePosition({ time: hoverTime, zoom: zoomRegion }) * timelineWidth;

  const isHoveredOnNonLoadingRegion = nonLoadingRegion.some(
    ({ start, end }) => start <= hoverTime && end >= hoverTime
  );

  const timestamp = getTimestamp(hoverTime);
  const message = isHoveredOnNonLoadingRegion ? `${timestamp} (Unloaded)` : timestamp;

  return (
    <div className="timeline-tooltip" style={{ left: offset }}>
      {message}
    </div>
  );
}
