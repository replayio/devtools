import React from "react";
import { connect } from "devtools/client/debugger/src/utils/connect";
import classnames from "classnames";
import { timelineMarkerWidth as pointWidth } from "ui/constants";
const { getAnalysisPointsForLocation } = selectors;
import { getExecutionPoint } from "devtools/client/debugger/src/reducers/pause";
import { getLocationKey } from "devtools/client/debugger/src/utils/breakpoint";
import { inBreakpointPanel } from "devtools/client/debugger/src/utils/editor";
import { actions } from "ui/actions";
import { Circle } from "ui/components/Timeline/Marker";
import { selectors } from "ui/reducers";

function toBigInt(num) {
  return num ? BigInt(num) : undefined;
}

function hasPrimaryHighlight({ hoveredItem, point }) {
  return hoveredItem?.point === point?.point;
}

function hasSecondaryHighlighted({ hoveredItem, breakpoint }) {
  if (!breakpoint.id || !hoveredItem?.location) {
    return false;
  }

  return breakpoint.id == getLocationKey(hoveredItem.location);
}

function BreakpointTimelinePoint({
  breakpoint,
  point,
  index,
  analysisPoints,
  executionPoint,
  zoomRegion,
  seek,
  hoveredItem,
  setHoveredItem,
  clearHoveredItem,
}) {
  const onMouseEnter = () =>
    setHoveredItem({
      location: breakpoint.location,
      point: point.point,
      target: "widget",
      time: point.time,
    });

  const onMouseLeave = e => {
    if (!inBreakpointPanel(e)) {
      clearHoveredItem();
    }
  };
  const onClick = e => {
    e.stopPropagation();
    seek(point.point, point.time, true);
  };

  const { startTime, endTime } = zoomRegion;
  const leftPercentOffset = ((point.time - startTime) / (endTime - startTime)) * 100;

  return (
    <div
      className={classnames("breakpoint-navigation-timeline-point", {
        future: toBigInt(point.point) > toBigInt(executionPoint),
        past: toBigInt(point.point) < toBigInt(executionPoint),
        pause: toBigInt(point.point) == toBigInt(executionPoint),
        "primary-highlight": hasPrimaryHighlight({ hoveredItem, point }),
        "secondary-highlight": hasSecondaryHighlighted({ breakpoint, hoveredItem }),
      })}
      title={`${index + 1}/${analysisPoints?.data.length}`}
      onClick={onClick}
      style={{ left: `calc(${leftPercentOffset}% - ${pointWidth / 2}px)` }}
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
      hasChanged("executionPoint") ||
      hasChanged("analysisPoints")
    ) {
      return false;
    }

    return true;
  }
);

export default connect(
  (state, { breakpoint }) => ({
    analysisPoints: getAnalysisPointsForLocation(
      state,
      breakpoint.location,
      breakpoint.options.condition
    ),
    executionPoint: getExecutionPoint(state),
    zoomRegion: selectors.getZoomRegion(state),
  }),
  {
    clearHoveredItem: actions.clearHoveredItem,
    seek: actions.seek,
    setHoveredItem: actions.setHoveredItem,
  }
)(MemoizedBreakpointTimelinePoint);
