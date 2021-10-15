import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import { getVisiblePosition } from "ui/utils/timeline";
import { features } from "ui/utils/prefs";
import "./Tooltip.css";

export function Tooltip({ hoverTime, zoomRegion, timelineWidth, isTrimming }: Props) {
  if (!hoverTime || (features.trimming && isTrimming)) {
    return null;
  }

  let offset = getVisiblePosition({ time: hoverTime, zoom: zoomRegion }) * timelineWidth;

  const time = new Date(hoverTime || 0);
  const seconds = time.getSeconds().toString().padStart(2, "0");
  const minutes = time.getMinutes();

  return (
    <div className="timeline-tooltip" style={{ left: offset }}>
      {`${minutes}:${seconds}`}
    </div>
  );
}

const connector = connect((state: UIState) => ({
  hoverTime: selectors.getHoverTime(state),
  zoomRegion: selectors.getZoomRegion(state),
  isTrimming: selectors.getIsTrimming(state),
}));

type PropsFromRedux = ConnectedProps<typeof connector>;
type Props = PropsFromRedux & {
  timelineWidth: number;
};

export default connector(Tooltip);
