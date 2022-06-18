import React from "react";
import { useAppSelector } from "ui/setup/hooks";
import { getNonLoadingTimeRanges } from "ui/reducers/app";
import {
  getHoverTime,
  getFocusRegion,
  getShowFocusModeControls,
  getZoomRegion,
} from "ui/reducers/timeline";
import {
  getVisiblePosition,
  displayedBeginForFocusRegion,
  displayedEndForFocusRegion,
} from "ui/utils/timeline";

const getTimestamp = (time?: number) => {
  const date = new Date(time || 0);
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const minutes = date.getMinutes();

  return `${minutes}:${seconds}`;
};

export default function Tooltip({ timelineWidth }: { timelineWidth: number }) {
  const hoverTime = useAppSelector(getHoverTime);
  const zoomRegion = useAppSelector(getZoomRegion);
  const showFocusModeControls = useAppSelector(getShowFocusModeControls);
  const nonLoadingRegion = useAppSelector(getNonLoadingTimeRanges);
  const focusRegion = useAppSelector(getFocusRegion);

  if (!hoverTime || showFocusModeControls) {
    return null;
  }

  let offset = getVisiblePosition({ time: hoverTime, zoom: zoomRegion }) * timelineWidth;

  const isHoveredOnNonLoadingRegion = nonLoadingRegion.some(
    ({ start, end }) => start <= hoverTime && end >= hoverTime
  );

  const isHoveredOnUnFocusedRegion =
    focusRegion &&
    (displayedBeginForFocusRegion(focusRegion) > hoverTime ||
      displayedEndForFocusRegion(focusRegion) < hoverTime);

  const timestamp = getTimestamp(hoverTime);
  const message =
    isHoveredOnNonLoadingRegion || isHoveredOnUnFocusedRegion
      ? `${timestamp} (Unloaded)`
      : timestamp;

  return (
    <div className="timeline-tooltip" style={{ left: offset }}>
      {message}
    </div>
  );
}
