import React, { useState, useEffect, useRef } from "react";
import { actions as UIActions } from "../../../../../../../ui/actions";
import { timelineMarkerWidth as pointWidth } from "../../../../../../../ui/constants";
import { connect } from "../../../utils/connect";
import { selectors } from "../../../../../../../ui/reducers";
const { getAnalysisPointsForLocation } = selectors;
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

function BreakpointTimeline({
  breakpoint,
  analysisPoints,
  zoomRegion,
  setZoomRegion,
  setZoomedBreakpoint,
}) {
  const timelineNode = useRef();
  const [mounted, setMounted] = useState(false);
  const title = "Cmd + click to zoom into these points";

  // Trigger a re-render on mount so that we can pass down the correct timelineNode.
  useEffect(() => setMounted(true), []);

  const handleClick = e => {
    if (e.metaKey && analysisPoints?.length) {
      const newZoomRegion = getNewZoomRegion(zoomRegion, analysisPoints);
      setZoomRegion(newZoomRegion);
      setZoomedBreakpoint(breakpoint);
    }
  };

  return (
    <div className="breakpoint-navigation-timeline-container">
      <div
        className="breakpoint-navigation-timeline"
        ref={timelineNode}
        onClick={handleClick}
        title={title}
        style={{ height: `${pointWidth + 2}px` }} // Add 2 to adjust for the 1px border
      >
        {timelineNode.current
          ? analysisPoints.map((p, i) => (
              <BreakpointTimelinePoint
                breakpoint={breakpoint}
                point={p}
                key={i}
                index={i}
                timelineNode={timelineNode.current}
              />
            ))
          : null}
      </div>
    </div>
  );
}

export default connect(
  (state, { breakpoint }) => ({
    analysisPoints: getAnalysisPointsForLocation(state, breakpoint.location),
    zoomRegion: selectors.getZoomRegion(state),
  }),
  {
    setZoomRegion: UIActions.setZoomRegion,
  }
)(BreakpointTimeline);
