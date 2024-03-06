import React, { useLayoutEffect, useRef } from "react";

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

  const ref = useRef<HTMLDivElement>(null);

  const offset = getVisiblePosition({ time: hoverTime, zoom: zoomRegion }) * timelineWidth;

  useLayoutEffect(() => {
    const element = ref.current;
    if (element != null && offset != null) {
      const rect = element.getBoundingClientRect();
      const left = Math.max(0, offset - rect.width / 2);
      element.style.left = `${left}px`;
    }
  }, [offset]);

  if (!hoverTime || showFocusModeControls) {
    return null;
  }

  const isHoveredOnNonLoadingRegion = nonLoadingTimeRanges.some(
    ({ start, end }) => start <= hoverTime && end >= hoverTime
  );

  const isHoveredOnUnFocusedRegion =
    focusWindow && (focusWindow.begin > hoverTime || focusWindow.end < hoverTime);

  const timestamp = getFormattedTime(hoverTime);

  const message =
    isHoveredOnNonLoadingRegion || isHoveredOnUnFocusedRegion
      ? "This part of the timeline has been unloaded. Click the icon in the bottom right to adjust this window."
      : timestamp;

  return (
    <div
      className="timeline-tooltip"
      data-longer-message={isHoveredOnNonLoadingRegion || isHoveredOnUnFocusedRegion || undefined}
      ref={ref}
    >
      {message}
    </div>
  );
}
