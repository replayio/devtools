import React from "react";
import { connect } from "react-redux";
import { selectors } from "../reducers";

let screen;

export function Tooltip({ tooltip }) {
  if (!tooltip) {
    return null;
  }
  if (tooltip.screen) {
    screen = tooltip.screen;
  }

  const currentScreen = tooltip.screen || screen;
  return (
    <div className="timeline-tooltip" style={{ left: tooltip.left }}>
      {currentScreen && (
        <img
          style={{ opacity: tooltip.screen ? 1 : 0.8 }}
          className="timeline-tooltip-image"
          src={`data:${currentScreen.mimeType};base64,${currentScreen.data}`}
        />
      )}
    </div>
  );
}

export default connect(state => ({
  tooltip: selectors.getTooltip(state),
}))(Tooltip);
