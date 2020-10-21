import React from "react";
import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";

import "./ScrollContainer.css";

// Give the user ~2 screen viewport height's worth of scroll zooming.
const contentHeight = "200vh";
// Default scale value is 1. For every multiple of the sensitivity constant
// below, scale is increased by 1. In this case, it takes 200pixels of
// scrolling to increase scale by 1.
const sensitivity = "200";

function ScrollContainer({ hoverTime, zoomRegion, setZoomRegion, recordingDuration }) {
  const onScroll = e => {
    const newZoomRegion = getZoomRegion({
      hoverTime,
      zoomRegion,
      recordingDuration,
      scrollTop: e.target.scrollTop,
    });
    setZoomRegion(newZoomRegion);

    gToolbox.getPanel("console").hud.setZoomedRegion(newZoomRegion);
  };

  return (
    <div className="scroll-container" onScroll={onScroll}>
      <div className="scroll-content" style={{ height: `${contentHeight}` }} />
    </div>
  );
}

export default connect(
  state => ({
    recordingDuration: selectors.getRecordingDuration(state),
    zoomRegion: selectors.getZoomRegion(state),
    hoverTime: selectors.getHoverTime(state),
  }),
  {
    setZoomRegion: actions.setZoomRegion,
  }
)(ScrollContainer);

function getZoomRegion({ hoverTime, zoomRegion, recordingDuration, scrollTop }) {
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
