import clamp from "lodash/clamp";
import React from "react";

import {
  getCurrentTime,
  getHoverTime,
  getPlaybackPrecachedTime,
  getZoomRegion,
} from "ui/reducers/timeline";
import { useAppSelector } from "ui/setup/hooks";
import { getVisiblePosition } from "ui/utils/timeline";

export default function ProgressBars() {
  const currentTime = useAppSelector(getCurrentTime);
  const hoverTime = useAppSelector(getHoverTime);
  const precachedTime = useAppSelector(getPlaybackPrecachedTime);
  const zoomRegion = useAppSelector(getZoomRegion);

  const percent = getVisiblePosition({ time: currentTime, zoom: zoomRegion }) * 100;
  const hoverPercent = getVisiblePosition({ time: hoverTime, zoom: zoomRegion }) * 100;
  const precachedPercent = getVisiblePosition({ time: precachedTime, zoom: zoomRegion }) * 100;

  return (
    <>
      <div className="progress-line full" />
      <div
        className="progress-line preview-max"
        style={{ width: `${clamp(Math.max(hoverPercent, precachedPercent), 0, 100)}%` }}
      />
      <div
        className="progress-line preview-min"
        style={{ width: `${clamp(Math.min(hoverPercent, precachedPercent), 0, 100)}%` }}
        data-hover-value={hoverPercent}
      />
      <div
        className="progress-line"
        data-test-name="current-progress"
        style={{ width: `${clamp(percent, 0, 100)}%` }}
        data-current-progress-value={percent}
      />
    </>
  );
}
