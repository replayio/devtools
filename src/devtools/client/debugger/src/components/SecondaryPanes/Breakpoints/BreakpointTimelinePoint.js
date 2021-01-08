import React, { useState, useEffect } from "react";
import { connect } from "devtools/client/debugger/src/utils/connect";
import classnames from "classnames";
import { selectors } from "ui/reducers";
import { timelineMarkerWidth as pointWidth } from "ui/constants";
const { getAnalysisPointsForLocation } = selectors;
import { actions } from "ui/actions";
import { Marker } from "ui/components/Timeline/Message";
import { getExecutionPoint } from "devtools/client/debugger/src/reducers/pause";
import { getLocationKey } from "devtools/client/debugger/src/utils/breakpoint";

function toBigInt(num) {
  return num ? BigInt(num) : undefined;
}

function getIsSecondaryHighlighted(hoveredPoint, breakpoint) {
  if (!breakpoint.id || !hoveredPoint?.location) {
    return false;
  }

  return breakpoint.id == getLocationKey(hoveredPoint.location);
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
  breakpoint,
  point,
  index,
  timelineNode,
  analysisPoints,
  executionPoint,
  zoomRegion,
  seek,
  hoveredPoint,
  setHoveredPoint,
}) {
  const [leftPercentOffset, setLeftPercentOffset] = useState(0);
  const isPrimaryHighlighted = hoveredPoint?.point === point.point;
  const isSecondaryHighlighted = getIsSecondaryHighlighted(hoveredPoint, breakpoint);

  console.log(breakpoint);

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

  const onMouseEnter = () => {
    const hoveredPoint = {
      target: "widget",
      point: point.point,
      time: point.time,
      location: breakpoint.location,
    };
    setHoveredPoint(hoveredPoint);
  };
  const onMouseLeave = () => setHoveredPoint(null);

  return (
    <div
      className={classnames("breakpoint-navigation-timeline-point", {
        past: toBigInt(point.point) < toBigInt(executionPoint),
        future: toBigInt(point.point) > toBigInt(executionPoint),
        pause: toBigInt(point.point) == toBigInt(executionPoint),
        "primary-highlight": isPrimaryHighlighted,
        "secondary-highlight": isSecondaryHighlighted,
      })}
      title={`${index + 1}/${analysisPoints.length}`}
      onClick={() => seek(point.point, point.time, true)}
      style={{ left: `${leftPercentOffset}%` }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Marker onMarkerClick={() => {}} />
    </div>
  );
}

const MemoizedBreakpointTimelinePoint = React.memo(
  BreakpointTimelinePoint,
  (prevProps, nextProps) => {
    const { hoveredPoint, point, breakpoint } = prevProps;

    const hoveredPointChanged = hoveredPoint !== nextProps.hoveredPoint;
    const isHighlighted =
      hoveredPoint?.point == point.point || getIsSecondaryHighlighted(hoveredPoint, breakpoint);
    const willBeHighlighted =
      nextProps.hoveredPoint?.point == point.point ||
      getIsSecondaryHighlighted(nextProps.hoveredPoint, breakpoint);

    if (hoveredPointChanged && !isHighlighted && !willBeHighlighted) {
      return true;
    }

    return false;
  }
);

export default connect(
  (state, { breakpoint }) => ({
    analysisPoints: getAnalysisPointsForLocation(state, breakpoint.location),
    executionPoint: getExecutionPoint(state),
    zoomRegion: selectors.getZoomRegion(state),
    recordingDuration: selectors.getRecordingDuration(state),
  }),
  {
    seek: actions.seek,
    setHoveredPoint: actions.setHoveredPoint,
  }
)(MemoizedBreakpointTimelinePoint);
