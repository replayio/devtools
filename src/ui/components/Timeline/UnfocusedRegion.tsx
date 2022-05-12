import { clamp } from "lodash";
import { useSelector } from "react-redux";
import { selectors } from "ui/reducers";
import { trackEvent } from "ui/utils/telemetry";
import { getVisiblePosition } from "ui/utils/timeline";

export default function UnfocusedRegion() {
  const focusRegion = useSelector(selectors.getFocusRegion);
  const zoomRegion = useSelector(selectors.getZoomRegion);

  if (!focusRegion) {
    return null;
  }

  const { startTime, endTime } = focusRegion;
  const duration = zoomRegion.endTime - zoomRegion.startTime;

  const start = getVisiblePosition({ time: startTime, zoom: zoomRegion }) * 100;
  const end = getVisiblePosition({ time: duration - endTime, zoom: zoomRegion }) * 100;

  return (
    <>
      <div
        className="unfocused-regions-container start"
        title="This region is unfocused"
        style={{
          width: `${clamp(start, 0, 100)}%`,
        }}
        onClick={() => trackEvent("error.unfocused_timeline_click")}
      >
        <div className="unfocused-regions" />
      </div>
      <div
        className="unfocused-regions-container end"
        title="This region is unfocused"
        style={{
          width: `${clamp(end, 0, 100)}%`,
        }}
        onClick={() => trackEvent("error.unfocused_timeline_click")}
      >
        <div className="unfocused-regions" />
      </div>
    </>
  );
}
