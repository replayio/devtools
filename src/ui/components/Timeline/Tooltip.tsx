import React from "react";

import { getFormattedTime } from "shared/utils/time";
import { getNonLoadingTimeRanges } from "ui/reducers/app";
import {
  getDisplayedFocusRegion,
  getHoverTime,
  getShowFocusModeControls,
  getZoomRegion,
} from "ui/reducers/timeline";
import { useAppSelector } from "ui/setup/hooks";
import { getVisiblePosition } from "ui/utils/timeline";

export default function Tooltip({ timelineWidth }: { timelineWidth: number }) {
  const hoverTime = useAppSelector(getHoverTime);
  const zoomRegion = useAppSelector(getZoomRegion);
  const showFocusModeControls = useAppSelector(getShowFocusModeControls);
  const nonLoadingRegion = useAppSelector(getNonLoadingTimeRanges);
  const displayedFocusRegion = useAppSelector(getDisplayedFocusRegion);

  if (!hoverTime || showFocusModeControls) {
    return null;
  }

  let offset = getVisiblePosition({ time: hoverTime, zoom: zoomRegion }) * timelineWidth;

  const isHoveredOnNonLoadingRegion = nonLoadingRegion.some(
    ({ start, end }) => start <= hoverTime && end >= hoverTime
  );

  const isHoveredOnUnFocusedRegion =
    displayedFocusRegion &&
    (displayedFocusRegion.begin > hoverTime || displayedFocusRegion.end < hoverTime);

  const timestamp = getFormattedTime(hoverTime);
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
