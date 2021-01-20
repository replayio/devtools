import React, { useState, useEffect } from "react";
import { connect } from "devtools/client/debugger/src/utils/connect";
import classnames from "classnames";
import { selectors } from "ui/reducers";
import { timelineMarkerWidth as pointWidth } from "ui/constants";
const { getAnalysisPointsForLocation } = selectors;
import { actions } from "ui/actions";
import { Circle } from "ui/components/Timeline/Marker";
import { getExecutionPoint } from "devtools/client/debugger/src/reducers/pause";
import { getLocationKey } from "devtools/client/debugger/src/utils/breakpoint";

function toBigInt(num) {
  return num ? BigInt(num) : undefined;
}

function hasPrimaryHighlight({ hoveredPoint, point }) {
  return hoveredPoint?.point === point?.point;
}

function hasSecondaryHighlighted({ hoveredPoint, breakpoint }) {
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

  const onMouseEnter = () =>
    setHoveredPoint({
      target: "widget",
      point: point.point,
      time: point.time,
      location: breakpoint.location,
    });

  const onMouseLeave = () => setHoveredPoint(null);

  return (
    <div
      className={classnames("breakpoint-navigation-timeline-point", {
        past: toBigInt(point.point) < toBigInt(executionPoint),
        future: toBigInt(point.point) > toBigInt(executionPoint),
        pause: toBigInt(point.point) == toBigInt(executionPoint),
        "primary-highlight": hasPrimaryHighlight({ hoveredPoint, point }),
        "secondary-highlight": hasSecondaryHighlighted({ hoveredPoint, breakpoint }),
      })}
      title={`${index + 1}/${analysisPoints.length}`}
      onClick={() => seek(point.point, point.time, true)}
      style={{ left: `${leftPercentOffset}%` }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Circle />
    </div>
  );
}

const MemoizedBreakpointTimelinePoint = React.memo(
  BreakpointTimelinePoint,
  (prevProps, nextProps) => {
    function selectorChanged(selector) {
      return selector(nextProps) !== selector(prevProps);
    }

    function hasChanged(key) {
      return nextProps[key] !== prevProps[key];
    }

    if (
      selectorChanged(hasPrimaryHighlight) ||
      selectorChanged(hasSecondaryHighlighted) ||
      hasChanged("zoomRegion") ||
      hasChanged("executionPoint")
    ) {
      return false;
    }

    return true;
  }
);

export default connect(
  (state, { breakpoint }) => ({
    analysisPoints: getAnalysisPointsForLocation(state, breakpoint.location),
    executionPoint: getExecutionPoint(state),
    zoomRegion: selectors.getZoomRegion(state),
  }),
  {
    seek: actions.seek,
    setHoveredPoint: actions.setHoveredPoint,
  }
)(MemoizedBreakpointTimelinePoint);
