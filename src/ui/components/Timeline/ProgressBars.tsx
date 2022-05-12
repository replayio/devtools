import { clamp } from "lodash";
import React from "react";
import { useSelector } from "react-redux";
import { selectors } from "ui/reducers";
import { getVisiblePosition } from "ui/utils/timeline";

export default function ProgressBars() {
  const currentTime = useSelector(selectors.getCurrentTime);
  const hoverTime = useSelector(selectors.getHoverTime);
  const precachedTime = useSelector(selectors.getPlaybackPrecachedTime);
  const zoomRegion = useSelector(selectors.getZoomRegion);

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
      />
      <div className="progress-line" style={{ width: `${clamp(percent, 0, 100)}%` }} />
    </>
  );
}
