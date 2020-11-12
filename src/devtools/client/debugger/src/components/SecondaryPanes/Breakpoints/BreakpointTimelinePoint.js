import React, { useState, useEffect } from "react";
import { connect } from "../../../utils/connect";
import classnames from "classnames";
import { selectors } from "../../../../../../../ui/reducers";
const { getAnalysisPointsForLocation } = selectors;
import actions from "../../../actions";
import { Marker } from "../../../../../../../ui/components/Timeline/Message";
import { getThreadExecutionPoint } from "../../../reducers/pause";
import { timelineMarkerWidth as pointWidth } from "../../../../../../../ui/constants";
import { executeSync } from "graphql";

function getClassnameObject(point, executionPoint) {
  const classObj = { past: false, pause: false, future: false };

  if (!executionPoint) {
    return classObj;
  }

  if (BigInt(point) < BigInt(executionPoint)) {
    classObj.past = true;
  } else if (BigInt(point) > BigInt(executionPoint)) {
    classObj.future = true;
  } else {
    classObj.pause = true;
  }

  return classObj;
}

export function getLeftPercentOffset({ point, timelineNode, zoomRegion, markerWidth }) {
  const timelineWidth = timelineNode.getBoundingClientRect().width;

  const startTime = zoomRegion.startTime;
  const endTime = zoomRegion.endTime;

  // Percent offset values are [0, 100].
  const unadjustedLeftPercentOffset = ((point.time - startTime) / (endTime - startTime)) * 100;
  const unadjustedLeftPixelOffset = (unadjustedLeftPercentOffset / 100) * timelineWidth;
  const leftPixelOffset = unadjustedLeftPixelOffset - markerWidth / 2;
  const leftPercentOffset = (leftPixelOffset * 100) / timelineWidth;
  return leftPercentOffset;
}

function BreakpointTimelinePoint({
  point,
  index,
  timelineNode,
  analysisPoints,
  executionPoint,
  zoomRegion,
  recordingDuration,
  seekToPosition,
}) {
  const [leftPercentOffset, setLeftPercentOffset] = useState(0);
  const classnameObj = getClassnameObject(point.point, executionPoint);

  // Hide the point if there is no execution point, which happens in between pauses when using the
  // command bar's resume button.
  const opacity = executionPoint ? "1" : "0";

  useEffect(() => {
    const offset = getLeftPercentOffset({
      point,
      timelineNode,
      zoomRegion,
      markerWidth: pointWidth,
    });

    setLeftPercentOffset(offset);
  });

  return (
    <div
      className={classnames("breakpoint-navigation-timeline-point", classnameObj)}
      title={`${index + 1}/${analysisPoints.length}`}
      onClick={() => seekToPosition(point.point, point.time)}
      style={{
        left: `${leftPercentOffset}%`,
        opacity: opacity,
      }}
    >
      <Marker onMarkerClick={() => {}} />
    </div>
  );
}

export default connect(
  (state, { breakpoint }) => ({
    analysisPoints: getAnalysisPointsForLocation(state, breakpoint.location),
    executionPoint: getThreadExecutionPoint(state),
    zoomRegion: selectors.getZoomRegion(state),
    recordingDuration: selectors.getRecordingDuration(state),
  }),
  {
    seekToPosition: actions.seekToPosition,
  }
)(BreakpointTimelinePoint);
