import React from "react";

import { getFormattedTime } from "shared/utils/time";
import { useNonLoadingTimeRanges } from "ui/components/Timeline/useNonLoadingTimeRanges";
import {
  getFocusWindow,
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
  const nonLoadingTimeRanges = useNonLoadingTimeRanges();

  const focusWindow = useAppSelector(getFocusWindow);

  if (!hoverTime || showFocusModeControls) {
    return null;
  }

  let offset = getVisiblePosition({ time: hoverTime, zoom: zoomRegion }) * timelineWidth;

  const isHoveredOnNonLoadingRegion = nonLoadingTimeRanges.some(
    ({ start, end }) => start <= hoverTime && end >= hoverTime
  );

  const isHoveredOnUnFocusedRegion =
    focusWindow && (focusWindow.begin.time > hoverTime || focusWindow.end.time < hoverTime);

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
