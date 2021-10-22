import React, { useState, useRef } from "react";
import classnames from "classnames";

import { actions as UIActions } from "ui/actions";
import { selectors } from "ui/reducers";
import { timelineMarkerWidth as pointWidth } from "ui/constants";
import { connect } from "devtools/client/debugger/src/utils/connect";
import BreakpointTimelinePoint from "./BreakpointTimelinePoint";
import { isMatchingLocation } from "devtools/client/debugger/src/utils/breakpoint";
const { prefs } = require("ui/utils/prefs");
import { getVisiblePosition } from "ui/utils/timeline";
import PortalTooltip from "ui/components/shared/PortalTooltip";
import { mostRecentPaintOrMouseEvent } from "protocol/graphics";

import TimeTooltip from "devtools/client/debugger/src/components/SecondaryPanes/Breakpoints/TimeTooltip";

function BreakpointTimeline({
  breakpoint,
  analysisPoints,
  zoomRegion,
  currentTime,
  hoveredItem,
  seek,
}) {
  const [hoveredTime, setHoveredTime] = useState(0);
  const [hoveredCoordinates, setHoveredCoordinates] = useState(null);
  const timelineRef = useRef(null);

  const onMouseMove = e => {
    const { startTime, endTime } = zoomRegion;
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const clickLeft = e.clientX;

    const clickPosition = Math.max((clickLeft - left) / width, 0);
    const time = Math.ceil(startTime + (endTime - startTime) * clickPosition);
    setHoveredTime(time);
    setHoveredCoordinates({ x: e.clientX, y: e.clientY });
  };
  const onMouseLeave = e => {
    setHoveredTime(null);
    setHoveredCoordinates(null);
  };
  const onClick = e => {
    const event = mostRecentPaintOrMouseEvent(hoveredTime);
    if (event && event.point) {
      seek(event.point, hoveredTime, false);
    }
  };

  const shouldDim =
    hoveredItem?.location && !isMatchingLocation(hoveredItem?.location, breakpoint.location);
  const hoverPercent = `${getVisiblePosition({ time: hoveredTime, zoom: zoomRegion }) * 100}%`;
  const percent = getVisiblePosition({ time: currentTime, zoom: zoomRegion }) * 100;

  return (
    <div className="breakpoint-navigation-timeline-container relative">
      <div
        className={classnames("breakpoint-navigation-timeline relative cursor-pointer", {
          dimmed: shouldDim,
        })}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        ref={timelineRef}
        style={{ height: `${pointWidth + 2}px` }} // 2px to account for the 1px top+bottom border
      >
        <div className="progress-line full" />
        <div className="progress-line preview-min" style={{ width: hoverPercent }} />
        <div className="progress-line" style={{ width: `${percent}%` }} />
        {analysisPoints !== "error" && analysisPoints?.length < prefs.maxHitsDisplayed
          ? analysisPoints.map((p, i) => (
              <BreakpointTimelinePoint
                breakpoint={breakpoint}
                point={p}
                key={i}
                index={i}
                hoveredItem={hoveredItem}
              />
            ))
          : null}
        {hoveredCoordinates ? (
          <PortalTooltip targetCoordinates={hoveredCoordinates} targetElement={timelineRef.current}>
            <TimeTooltip time={hoveredTime} />
          </PortalTooltip>
        ) : null}
      </div>
    </div>
  );
}

export default connect(
  (state, { breakpoint }) => ({
    analysisPoints: selectors.getAnalysisPointsForLocation(
      state,
      breakpoint.location,
      breakpoint.options.condition
    ),
    zoomRegion: selectors.getZoomRegion(state),
    currentTime: selectors.getCurrentTime(state),
    hoveredItem: selectors.getHoveredItem(state),
  }),
  {
    seek: UIActions.seek,
  }
)(BreakpointTimeline);
