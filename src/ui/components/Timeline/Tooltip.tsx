import React from "react";
import { useSelector } from "react-redux";
import { getIsFocusing, getNonLoadingTimeRanges } from "ui/reducers/app";
import { getHoverTime, getZoomRegion } from "ui/reducers/timeline";
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
  const isFocusing = useSelector(getIsFocusing);
  const nonLoadingRegion = useSelector(getNonLoadingTimeRanges);
  const shouldHideTooltip = !hoverTime || isFocusing;

  if (shouldHideTooltip) {
    return null;
  }

  let offset = getVisiblePosition({ time: hoverTime, zoom: zoomRegion }) * timelineWidth;

  const isHoveredOnNonLoadingRegion = nonLoadingRegion.some(
    r => r.start <= hoverTime && r.end >= hoverTime
  );
  const msg = isHoveredOnNonLoadingRegion ? "Unloaded" : getTimestamp(hoverTime);

  return (
    <div className="timeline-tooltip" style={{ left: offset }}>
      {msg}
    </div>
  );
}
