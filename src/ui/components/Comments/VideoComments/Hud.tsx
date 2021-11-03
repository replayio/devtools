import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
const AccessibleImage = require("devtools/client/debugger/src/components/shared/AccessibleImage")
  .default;

export function Hud({ hoverTime, currentTime, stalled }: Props) {
  if (stalled) {
    return (
      <div className="canvas-hud">
        <AccessibleImage className="loader spin" />
      </div>
    );
  }

  const time = new Date(hoverTime || currentTime || 0);
  const seconds = time.getSeconds().toString().padStart(2, "0");
  const minutes = time.getMinutes();

  return <div className="canvas-hud">{`${minutes}:${seconds}`}</div>;
}

const connector = connect((state: UIState) => ({
  currentTime: selectors.getCurrentTime(state),
  hoverTime: selectors.getHoverTime(state),
  zoomRegion: selectors.getZoomRegion(state),
  stalled: selectors.isPlaybackStalled(state),
}));

type PropsFromRedux = ConnectedProps<typeof connector>;
type Props = PropsFromRedux;

export default connector(Hud);
