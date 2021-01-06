import React, { useState, useEffect, useRef } from "react";
import classnames from "classnames";

import { actions as UIActions } from "ui/actions";
import { selectors } from "ui/reducers";
import { timelineMarkerWidth as pointWidth } from "ui/constants";
import { connect } from "devtools/client/debugger/src/utils/connect";
import BreakpointTimelinePoint from "./BreakpointTimelinePoint";

function getNewZoomRegion(zoomRegion, analysisPoints) {
  let newZoomRegion = {
    ...zoomRegion,
    startTime: analysisPoints[0].time,
    endTime: analysisPoints[analysisPoints.length - 1].time,
  };

  if (analysisPoints.length === 1) {
    const deltaBefore = analysisPoints[0].time - zoomRegion.startTime;
    const deltaAfter = zoomRegion.endTime - analysisPoints[0].time;

    let startTime, endTime;

    if (deltaBefore < deltaAfter) {
      startTime = zoomRegion.startTime;
      endTime = analysisPoints[0].time + deltaBefore;
    } else {
      startTime = analysisPoints[0].time - deltaAfter;
      endTime = zoomRegion.endTime;
    }

    newZoomRegion = {
      ...zoomRegion,
      startTime,
      endTime,
    };
  }

  return newZoomRegion;
}

function getProgressPercent(time, zoomRegion) {
  const { startTime, endTime } = zoomRegion;
  if (!time) {
    return 0;
  }

  if (time <= startTime) {
    return 0;
  }

  if (time >= endTime) {
    return 1;
  }

  return (time - startTime) / (endTime - startTime);
}

function BreakpointTimeline({
  breakpoint,
  analysisPoints,
  zoomRegion,
  setZoomRegion,
  setZoomedBreakpoint,
  currentTime,
  hoveredMessage,
}) {
  const timelineNode = useRef();
  const [, setMounted] = useState(false);
  const title = "Cmd + click to zoom into these points";
  const shouldDim = hoveredMessage;

  // Trigger a re-render on mount so that we can pass down the correct timelineNode.
  useEffect(() => setMounted(true), []);

  const handleClick = e => {
    if (e.metaKey && analysisPoints?.length) {
      const newZoomRegion = getNewZoomRegion(zoomRegion, analysisPoints);
      setZoomRegion(newZoomRegion);
      setZoomedBreakpoint(breakpoint);
    }
  };

  const percent = getProgressPercent(currentTime, zoomRegion) * 100;

  return (
    <div className="breakpoint-navigation-timeline-container">
      <div
        className={classnames("breakpoint-navigation-timeline", { dimmed: shouldDim })}
        ref={timelineNode}
        onClick={handleClick}
        title={title}
        style={{ height: `${pointWidth + 2}px` }} // 2px to account for the 1px top+bottom border
      >
        <div className="progress-line full" />
        <div className="progress-line" style={{ width: `${percent}%` }} />
        {timelineNode.current
          ? analysisPoints.map((p, i) => (
              <BreakpointTimelinePoint
                breakpoint={breakpoint}
                point={p}
                key={i}
                index={i}
                timelineNode={timelineNode.current}
                hoveredMessage={hoveredMessage}
              />
            ))
          : null}
      </div>
    </div>
  );
}

export default connect(
  (state, { breakpoint }) => ({
    analysisPoints: selectors.getAnalysisPointsForLocation(state, breakpoint.location),
    zoomRegion: selectors.getZoomRegion(state),
    currentTime: selectors.getCurrentTime(state),
    hoveredMessage: selectors.getHoveredMessage(state),
  }),
  {
    setZoomRegion: UIActions.setZoomRegion,
  }
)(BreakpointTimeline);
