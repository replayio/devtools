import React, { useState, useEffect } from "react";
import { connect } from "devtools/client/debugger/src/utils/connect";
import classnames from "classnames";
import { selectors } from "ui/reducers";
import { timelineMarkerWidth as pointWidth } from "ui/constants";
const { getAnalysisPointsForLocation } = selectors;
import { actions } from "ui/actions";
import { Marker } from "ui/components/Timeline/Message";
import { getExecutionPoint } from "devtools/client/debugger/src/reducers/pause";

function toBigInt(num) {
  return num ? BigInt(num) : undefined;
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
  seek,
}) {
  const [leftPercentOffset, setLeftPercentOffset] = useState(0);

  useEffect(() => {
    setLeftPercentOffset(
      getLeftPercentOffset({
        point,
        timelineNode,
        zoomRegion,
        markerWidth: pointWidth,
      })
    );
  }, [point, timelineNode, zoomRegion]);

  return (
    <div
      className={classnames("breakpoint-navigation-timeline-point", {
        past: toBigInt(point.point) < toBigInt(executionPoint),
        future: toBigInt(point.point) > toBigInt(executionPoint),
        pause: toBigInt(point.point) == toBigInt(executionPoint),
      })}
      title={`${index + 1}/${analysisPoints.length}`}
      onClick={() => seek(point.point, point.time, true)}
      style={{ left: `${leftPercentOffset}%` }}
    >
      <Marker onMarkerClick={() => {}} />
    </div>
  );
}

export default connect(
  (state, { breakpoint }) => ({
    analysisPoints: getAnalysisPointsForLocation(state, breakpoint.location),
    executionPoint: getExecutionPoint(state),
    zoomRegion: selectors.getZoomRegion(state),
    recordingDuration: selectors.getRecordingDuration(state),
  }),
  {
    seek: actions.seek,
  }
)(BreakpointTimelinePoint);
