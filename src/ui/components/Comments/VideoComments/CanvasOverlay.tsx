import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";

function CanvasOverlay({ canvas, children }: PropsFromRedux & { children?: React.ReactNode }) {
  if (!canvas) {
    return null;
  }

  const { top, left, width, height, scale } = canvas;

  return (
    <div
      className="canvas-overlay z-10 pointer-events-none absolute"
      style={{
        top: top,
        left: left,
        width: width * scale,
        height: height * scale,
      }}
    >
      {children}
    </div>
  );
}

const connector = connect((state: UIState) => ({
  canvas: selectors.getCanvas(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(CanvasOverlay);
