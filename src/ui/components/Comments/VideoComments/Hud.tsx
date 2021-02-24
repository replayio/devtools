import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import "./Hud.css";

export function Hud({ hoverTime }: Props) {
  if (!hoverTime) {
    return null;
  }

  const time = new Date(hoverTime || 0);
  const seconds = time.getSeconds().toString().padStart(2, "0");
  const minutes = time.getMinutes();

  return <div className="canvas-hud">{`${minutes}:${seconds}`}</div>;
}

const connector = connect((state: UIState) => ({
  hoverTime: selectors.getHoverTime(state),
  zoomRegion: selectors.getZoomRegion(state),
}));

type PropsFromRedux = ConnectedProps<typeof connector>;
type Props = PropsFromRedux & {
  timelineWidth: number;
};

export default connector(Hud);
