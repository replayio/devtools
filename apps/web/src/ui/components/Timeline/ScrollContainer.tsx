import React, { MouseEventHandler, UIEventHandler } from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";

import { UIState } from "ui/state";
import { ZoomRegion } from "ui/state/timeline";

// Give the user ~2 screen viewport height's worth of scroll zooming.
const contentHeight = "200vh";
// Default scale value is 1. For every multiple of the sensitivity constant
// below, scale is increased by 1. In this case, it takes 200pixels of
// scrolling to increase scale by 1.
const sensitivity = 200;

function ScrollContainer({
  hoverTime,
  zoomRegion,
  setZoomRegion,
  setZoomedRegion,
  recordingDuration,
}: PropsFromRedux) {
  const onScroll: UIEventHandler = e => {
    const newZoomRegion = getZoomRegion({
      hoverTime: hoverTime || 0,
      zoomRegion,
      recordingDuration: recordingDuration || 0,
      scrollTop: (e.target as Element).scrollTop,
    });
    setZoomRegion(newZoomRegion);
    const { startTime, endTime, scale } = newZoomRegion;
    setZoomedRegion(startTime, endTime, scale);
  };

  const handleClick: MouseEventHandler = e => {
    if (e.metaKey) {
      const newZoomRegion = {
        startTime: 0,
        endTime: recordingDuration || 0,
        scale: 1,
      };
      setZoomRegion(newZoomRegion);
    }
  };

  return (
    <div className="scroll-container" onScroll={onScroll} onClick={handleClick}>
      <div className="scroll-content" style={{ height: `${contentHeight}` }} />
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    recordingDuration: selectors.getRecordingDuration(state),
    zoomRegion: selectors.getZoomRegion(state),
    hoverTime: selectors.getHoverTime(state),
  }),
  {
    setZoomRegion: actions.setZoomRegion,
    setZoomedRegion: actions.setZoomedRegion,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(ScrollContainer);

function getZoomRegion({
  hoverTime,
  zoomRegion,
  recordingDuration,
  scrollTop,
}: {
  hoverTime: number;
  zoomRegion: ZoomRegion;
  recordingDuration: number;
  scrollTop: number;
}) {
  const newScale = 1 + scrollTop / sensitivity;
  const length = zoomRegion.endTime - zoomRegion.startTime;
  const leftToHover = hoverTime - zoomRegion.startTime;
  const rightToHover = zoomRegion.endTime - hoverTime;

  let newLength = recordingDuration / newScale;
  let startTime = zoomRegion.startTime - (newLength - length) * (leftToHover / length);
  let endTime = zoomRegion.endTime + (newLength - length) * (rightToHover / length);

  if (startTime < 0) {
    startTime = 0;
    endTime = newLength;
  } else if (endTime > recordingDuration) {
    endTime = recordingDuration;
    startTime = recordingDuration - newLength;
  }

  return { startTime, endTime, scale: newScale };
}
