import React from "react";
import { compareNumericStrings } from "../../../../../../../protocol/utils";
import { getThreadExecutionPoint } from "../../../reducers/pause";
import { connect } from "../../../utils/connect";
import { selectors } from "../../../../../../../ui/reducers";
const { getAnalysisPointsForLocation } = selectors;
import actions from "../../../actions";
import { findLast, find } from "lodash";

import BreakpointTimeline from "./BreakpointTimeline";

function BreakpointNavigation({
  executionPoint,
  breakpoint,
  seekToPosition,
  analysisPoints,
  setZoomedBreakpoint,
}) {
  const navigateToPoint = point => {
    if (point) {
      seekToPosition(point.point, point.time);
    }
  };

  const getStatus = () => {
    if (!analysisPoints?.length) {
      return "No hits";
    }

    const points = analysisPoints
      ? analysisPoints.filter(point => BigInt(point.point) <= BigInt(executionPoint))
      : [];

    return `${points.length} of ${analysisPoints ? analysisPoints.length : 0} hits`;
  };

  let prev, next;

  if (executionPoint && analysisPoints?.length > 0) {
    prev = findLast(analysisPoints, p => compareNumericStrings(p.point, executionPoint) < 0);
    next = find(analysisPoints, p => compareNumericStrings(p.point, executionPoint) > 0);
  }

  return (
    <div className="breakpoint-navigation">
      <div className="breakpoint-navigation-commands">
        <button
          className={`breakpoint-navigation-command-prev ${!prev ? " disabled" : ""}`}
          disabled={!prev}
          onClick={() => {
            navigateToPoint(prev);
          }}
        >
          <div className="img rewind" />
        </button>{" "}
        <button
          className={`breakpoint-navigation-command-next ${!next ? " disabled" : ""}`}
          disabled={!next}
          onClick={() => {
            navigateToPoint(next);
          }}
        >
          <div className="img resume" />
        </button>
      </div>
      {analysisPoints?.length ? (
        <BreakpointTimeline breakpoint={breakpoint} setZoomedBreakpoint={setZoomedBreakpoint} />
      ) : null}
      {executionPoint ? <div className="breakpoint-navigation-status">{getStatus()}</div> : null}
    </div>
  );
}

const mapStateToProps = (state, p) => ({
  analysisPoints: getAnalysisPointsForLocation(state, p.breakpoint.location),
  executionPoint: getThreadExecutionPoint(state),
});

export default connect(mapStateToProps, {
  seekToPosition: actions.seekToPosition,
})(BreakpointNavigation);
