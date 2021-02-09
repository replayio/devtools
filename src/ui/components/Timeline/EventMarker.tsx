import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { RecordingEvent } from "ui/state/timeline";
import { actions } from "ui/actions";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import Marker from "./Marker";

function EventMarker({
  event,
  currentTime,
  hoveredPoint,
  zoomRegion,
  overlayWidth,
  setActiveComment,
}: EventMarkerProps) {
  return (
    <Marker
      point={event.point}
      time={event.time}
      hasFrames={false}
      currentTime={currentTime}
      hoveredPoint={hoveredPoint}
      zoomRegion={zoomRegion}
      overlayWidth={overlayWidth}
      onSeek={() => setActiveComment(event)}
    />
  );
}

const connector = connect(
  (state: UIState) => ({
    zoomRegion: selectors.getZoomRegion(state),
    currentTime: selectors.getCurrentTime(state),
    hoveredPoint: selectors.getHoveredPoint(state),
    overlayWidth: selectors.getTimelineDimensions(state).width,
  }),
  {
    setActiveComment: actions.setActiveComment,
  }
);

type PropsFromRedux = ConnectedProps<typeof connector>;
type EventMarkerProps = PropsFromRedux & {
  event: RecordingEvent;
};

export default connector(EventMarker);
