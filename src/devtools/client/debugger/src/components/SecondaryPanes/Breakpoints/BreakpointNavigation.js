import React, { useEffect, useState } from "react";
import classnames from "classnames";
import findLast from "lodash/findLast";
import find from "lodash/find";
import { compareNumericStrings } from "protocol/utils";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { connect } from "devtools/client/debugger/src/utils/connect";
import MaterialIcon from "ui/components/shared/MaterialIcon";
const { prefs } = require("ui/utils/prefs");
const { trackEvent } = require("ui/utils/telemetry");

import BreakpointTimeline from "./BreakpointTimeline";
import "./BreakpointNavigation.css";

function BreakpointNavigation({
  executionPoint,
  indexed,
  breakpoint,
  seek,
  analysisPoints,
  editing,
  setShowCondition,
  showCondition,
  setZoomedBreakpoint = () => {},
}) {
  const [lastExecutionPoint, setLastExecutionPoint] = useState(null);

  const navigateToPoint = point => {
    trackEvent("breakpoint.navigate");
    if (point) {
      seek(point.point, point.time, true);
    }
  };
  const isEmpty = analysisPoints && (analysisPoints === "error" || analysisPoints?.length == 0);
  const isHot =
    analysisPoints && analysisPoints !== "error" && analysisPoints.length > prefs.maxHitsDisplayed;

  let prev, next;

  if (executionPoint && analysisPoints !== "error" && analysisPoints?.length > 0) {
    prev = findLast(analysisPoints, p => compareNumericStrings(p.point, executionPoint) < 0);
    next = find(analysisPoints, p => compareNumericStrings(p.point, executionPoint) > 0);
  }

  useEffect(() => {
    if (executionPoint && lastExecutionPoint !== executionPoint)
      setLastExecutionPoint(executionPoint);
  }, [executionPoint]);

  useEffect(() => {
    if (analysisPoints) {
      trackEvent(analysisPoints.length > 0 ? "breakpoint.has_hits" : "breakpoint.no_hits", {
        hits: analysisPoints.length,
      });
    }
  }, [analysisPoints]);

  return (
    <div className={classnames("breakpoint-navigation", { empty: isEmpty })}>
      {!isEmpty ? (
        <BreakpointNavigationCommands
          disabled={isHot}
          prev={prev}
          next={next}
          navigateToPoint={navigateToPoint}
        />
      ) : null}
      {analysisPoints !== "error" ? (
        <BreakpointTimeline breakpoint={breakpoint} setZoomedBreakpoint={setZoomedBreakpoint} />
      ) : (
        <div className="flex-grow" />
      )}
      <div className="relative">
        {editing ? (
          <div className="absolute right-0">
            <button
              className={classnames(
                "rounded-full h-5 w-5 p-px pt-0.5 border",
                showCondition
                  ? "border-primaryAccent text-primaryAccent"
                  : "border-gray-500 text-gray-500"
              )}
              style={{ height: "1.25rem", borderRadius: "100%" }}
              onClick={() => setShowCondition(!showCondition)}
            >
              <MaterialIcon>filter_list</MaterialIcon>
            </button>
          </div>
        ) : null}
        {executionPoint ? (
          <BreakpointNavigationStatus
            indexed={indexed}
            executionPoint={lastExecutionPoint}
            analysisPoints={analysisPoints}
            isHidden={editing}
          />
        ) : null}
      </div>
    </div>
  );
}

function BreakpointNavigationCommands({ disabled, prev, next, navigateToPoint }) {
  const prevDisabled = disabled || !prev;
  const nextDisabled = disabled || !next;
  return (
    <div className="breakpoint-navigation-commands">
      <button
        className={`breakpoint-navigation-command-prev ${prevDisabled ? " disabled" : ""}`}
        disabled={prevDisabled}
        onClick={() => navigateToPoint(prev)}
      >
        <div className="img rewind" />
      </button>{" "}
      <button
        className={`breakpoint-navigation-command-next ${nextDisabled || !next ? " disabled" : ""}`}
        disabled={nextDisabled}
        onClick={() => navigateToPoint(next)}
      >
        <div className="img rewind" style={{ transform: "rotate(180deg)" }} />
      </button>
    </div>
  );
}

function BreakpointNavigationStatus({ executionPoint, analysisPoints, indexed, isHidden }) {
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
    <div
      className={classnames("breakpoint-navigation-status-container", isHidden ? "invisible" : "")}
    >
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
