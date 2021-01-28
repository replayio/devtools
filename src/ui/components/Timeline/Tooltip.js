import React from "react";
import { connect } from "react-redux";
import { selectors } from "ui/reducers";

export function Tooltip({ tooltip, hoverTime }) {
  if (!tooltip) {
    return null;
  }

  const time = new Date(hoverTime);
  const seconds = time.getSeconds().toString().padStart(2, 0);
  const minutes = time.getMinutes();

  return (
    <div className="timeline-tooltip" style={{ left: tooltip.left }}>
      {`${minutes}:${seconds}`}
    </div>
  );
}

export default connect(state => ({
  hoverTime: selectors.getHoverTime(state),
  tooltip: selectors.getTooltip(state),
}))(Tooltip);
