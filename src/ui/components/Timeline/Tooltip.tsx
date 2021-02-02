import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";

export function Tooltip({ tooltip, hoverTime }: PropsFromRedux) {
  if (!tooltip) {
    return null;
  }

  const time = new Date(hoverTime || 0);
  const seconds = time.getSeconds().toString().padStart(2, "0");
  const minutes = time.getMinutes();

  return (
    <div className="timeline-tooltip" style={{ left: tooltip.left }}>
      {`${minutes}:${seconds}`}
    </div>
  );
}

const connector = connect((state: UIState) => ({
  hoverTime: selectors.getHoverTime(state),
  tooltip: selectors.getTooltip(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(Tooltip);
