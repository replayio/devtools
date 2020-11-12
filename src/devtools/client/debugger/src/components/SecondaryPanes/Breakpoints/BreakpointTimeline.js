import React, { useState, useEffect, useRef } from "react";
import { actions as UIActions } from "../../../../../../../ui/actions";
import { timelineMarkerWidth as pointWidth } from "../../../../../../../ui/constants";
import { connect } from "../../../utils/connect";
import { selectors } from "../../../../../../../ui/reducers";
const { getAnalysisPointsForLocation } = selectors;
import BreakpointTimelinePoint, { getLeftPercentOffset } from "./BreakpointTimelinePoint";

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
  currentTime,
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
        style={{ height: `${pointWidth + 2}px` }} // 2px to account for the 1px top+bottom border
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
        {timelineNode.current ? (
          <PauseLine
            point={{ time: currentTime }}
            timelineNode={timelineNode.current}
            zoomRegion={zoomRegion}
          />
        ) : null}
      </div>
    </div>
  );
}

function PauseLine({ point, timelineNode, zoomRegion }) {
  const [leftPercentOffset, setLeftPercentOffset] = useState(0);
  const markerWidth = 1;

  useEffect(() => {
    const offset = getLeftPercentOffset({
      point,
      timelineNode,
      zoomRegion,
      markerWidth,
    });

    setLeftPercentOffset(offset);
  });

  return (
    <div
      className="breakpoint-navigation-timeline-pause-marker"
      style={{
        left: `${leftPercentOffset}%`,
      }}
    />
  );
}

export default connect(
  (state, { breakpoint }) => ({
    analysisPoints: getAnalysisPointsForLocation(state, breakpoint.location),
    zoomRegion: selectors.getZoomRegion(state),
    currentTime: selectors.getCurrentTime(state),
  }),
  {
    setZoomRegion: UIActions.setZoomRegion,
  }
)(BreakpointTimeline);
