import React from "react";
import classnames from "classnames";

import { actions as UIActions } from "ui/actions";
import { selectors } from "ui/reducers";
import { timelineMarkerWidth as pointWidth } from "ui/constants";
import { connect } from "devtools/client/debugger/src/utils/connect";
import BreakpointTimelinePoint from "./BreakpointTimelinePoint";
import { isMatchingLocation } from "devtools/client/debugger/src/utils/breakpoint";
const { prefs } = require("ui/utils/prefs");

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
  hoveredItem,
}) {
  const shouldDim =
    hoveredItem?.location && !isMatchingLocation(hoveredItem?.location, breakpoint.location);

  const handleClick = e => {
    if (e.metaKey && analysisPoints !== "error" && analysisPoints?.length) {
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
        onClick={handleClick}
        style={{ height: `${pointWidth + 2}px` }} // 2px to account for the 1px top+bottom border
      >
        <div className="progress-line full" />
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
    setZoomRegion: UIActions.setZoomRegion,
  }
)(BreakpointTimeline);
