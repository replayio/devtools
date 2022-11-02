import clamp from "lodash/clamp";

import { selectors } from "ui/reducers";
import { useAppSelector } from "ui/setup/hooks";
import { trackEvent } from "ui/utils/telemetry";
import {
  displayedBeginForFocusRegion,
  displayedEndForFocusRegion,
  getVisiblePosition,
} from "ui/utils/timeline";

export default function UnfocusedRegion() {
  const focusRegion = useAppSelector(selectors.getFocusRegion);
  const zoomRegion = useAppSelector(selectors.getZoomRegion);

  if (!focusRegion) {
    return null;
  }

  const beginTime = displayedBeginForFocusRegion(focusRegion);
  const endTime = displayedEndForFocusRegion(focusRegion);
  const duration = zoomRegion.endTime - zoomRegion.beginTime;

  const start = getVisiblePosition({ time: beginTime, zoom: zoomRegion }) * 100;
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
