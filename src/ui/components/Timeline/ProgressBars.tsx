import clamp from "lodash/clamp";

import { getCurrentTime, getHoverTime, getZoomRegion } from "ui/reducers/timeline";
import { useAppSelector } from "ui/setup/hooks";
import { getVisiblePosition } from "ui/utils/timeline";

export default function ProgressBars() {
  const currentTime = useAppSelector(getCurrentTime);
  const hoverTime = useAppSelector(getHoverTime);
  const zoomRegion = useAppSelector(getZoomRegion);

  const percent = getVisiblePosition({ time: currentTime, zoom: zoomRegion }) * 100;
  const hoverPercent = getVisiblePosition({ time: hoverTime, zoom: zoomRegion }) * 100;

  return (
    <>
      <div className="progress-line full" />
      <div
        className="progress-line preview-max"
        style={{ width: `${clamp(hoverPercent, 0, 100)}%` }}
      />
      <div
        className="progress-line preview-min"
        style={{ width: `${clamp(hoverPercent, 0, 100)}%` }}
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
