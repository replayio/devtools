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
  isPrimaryHighlighted,
  zoomRegion,
  overlayWidth,
}: EventMarkerProps) {
  return (
    <Marker
      point={event.point}
      time={event.time}
      hasFrames={false}
      currentTime={currentTime}
      isPrimaryHighlighted={isPrimaryHighlighted}
      isSecondaryHighlighted={false}
      zoomRegion={zoomRegion}
      overlayWidth={overlayWidth}
    />
  );
}

const connector = connect((state: UIState) => ({
  zoomRegion: selectors.getZoomRegion(state),
  currentTime: selectors.getCurrentTime(state),
  overlayWidth: selectors.getTimelineDimensions(state).width,
}));

type PropsFromRedux = ConnectedProps<typeof connector>;
type EventMarkerProps = PropsFromRedux & {
  event: RecordingEvent;
  isPrimaryHighlighted: boolean;
};

export default connector(EventMarker);
