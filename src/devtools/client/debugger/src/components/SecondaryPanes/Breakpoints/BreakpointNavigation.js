import React, { useEffect, useState } from "react";
import classnames from "classnames";
import findLast from "lodash/findLast";
import find from "lodash/find";
import { compareNumericStrings } from "protocol/utils";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { connect } from "devtools/client/debugger/src/utils/connect";

import BreakpointTimeline from "./BreakpointTimeline";
import "./BreakpointNavigation.css";

function BreakpointNavigation({
  executionPoint,
  indexed,
  breakpoint,
  seek,
  analysisPoints,
  setZoomedBreakpoint = () => {},
}) {
  const [lastExecutionPoint, setLastExecutionPoint] = useState(null);

  const navigateToPoint = point => {
    if (point) {
      seek(point.point, point.time, true);
    }
  };
  const isEmpty = analysisPoints && (analysisPoints === "error" || analysisPoints?.length == 0);

  let prev, next;

  if (executionPoint && analysisPoints !== "error" && analysisPoints?.length > 0) {
    prev = findLast(analysisPoints, p => compareNumericStrings(p.point, executionPoint) < 0);
    next = find(analysisPoints, p => compareNumericStrings(p.point, executionPoint) > 0);
  }

  useEffect(() => {
    if (executionPoint && lastExecutionPoint !== executionPoint)
      setLastExecutionPoint(executionPoint);
  }, [executionPoint]);

  return (
    <div className={classnames("breakpoint-navigation", { empty: isEmpty })}>
      {!isEmpty ? (
        <BreakpointNavigationCommands prev={prev} next={next} navigateToPoint={navigateToPoint} />
      ) : null}
      {analysisPoints !== "error" && analysisPoints?.length ? (
        <BreakpointTimeline breakpoint={breakpoint} setZoomedBreakpoint={setZoomedBreakpoint} />
      ) : null}
      {executionPoint ? (
        <BreakpointNavigationStatus
          indexed={indexed}
          executionPoint={lastExecutionPoint}
          analysisPoints={analysisPoints}
        />
      ) : null}
    </div>
  );
}

function BreakpointNavigationCommands({ prev, next, navigateToPoint }) {
  return (
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
        <div className="img rewind" style={{ transform: "rotate(180deg)" }} />
      </button>
    </div>
  );
}

function BreakpointNavigationStatus({ executionPoint, analysisPoints, indexed }) {
  let status = "";
  if (!indexed) {
    status = "Indexing";
  } else if (!analysisPoints | !executionPoint) {
    status = "Loading";
  } else if (analysisPoints === "error") {
    status = "Failed";
  } else if (analysisPoints.length == 0) {
    status = "No hits";
  } else {
    const points = analysisPoints
      ? analysisPoints.filter(point => BigInt(point.point) <= BigInt(executionPoint))
      : [];

    status = `${points.length}/${analysisPoints.length}`;
  }

  return (
    <div className="breakpoint-navigation-status-container">
      <div className="px-3 py-0.5 rounded-2xl text-gray-500 bg-gray-200">{status}</div>
    </div>
  );
}

const mapStateToProps = (state, { breakpoint }) => ({
  analysisPoints: selectors.getAnalysisPointsForLocation(
    state,
    breakpoint.location,
    breakpoint.options.condition
  ),
  indexed: selectors.getIndexed(state),
  executionPoint: selectors.getExecutionPoint(state),
});

export default connect(mapStateToProps, {
  seek: actions.seek,
})(BreakpointNavigation);
