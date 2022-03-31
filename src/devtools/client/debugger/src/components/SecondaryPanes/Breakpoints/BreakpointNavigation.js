import React, { useEffect, useState } from "react";
import classnames from "classnames";
import findLast from "lodash/findLast";
import find from "lodash/find";
import { compareNumericStrings } from "protocol/utils";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { connect } from "devtools/client/debugger/src/utils/connect";
import MaterialIcon from "ui/components/shared/MaterialIcon";
const { trackEvent } = require("ui/utils/telemetry");

import BreakpointTimeline from "./BreakpointTimeline";

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
  const [lastExecutionPoint, setLastExecutionPoint] = useState(0);

  const navigateToPoint = point => {
    trackEvent("breakpoint.navigate");
    if (point) {
      seek(point.point, point.time, true);
    }
  };
  const isEmpty = analysisPoints && (analysisPoints.error || analysisPoints.data.length == 0);

  let prev, next;

  if (executionPoint && !analysisPoints?.error && analysisPoints?.data.length > 0) {
    prev = findLast(analysisPoints.data, p => compareNumericStrings(p.point, executionPoint) < 0);
    next = find(analysisPoints.data, p => compareNumericStrings(p.point, executionPoint) > 0);
  }

  useEffect(() => {
    if (executionPoint && lastExecutionPoint !== executionPoint) {
      setLastExecutionPoint(executionPoint);
    }
  }, [executionPoint]);

  useEffect(() => {
    if (analysisPoints) {
      trackEvent(analysisPoints.data.length > 0 ? "breakpoint.has_hits" : "breakpoint.no_hits", {
        hits: analysisPoints.data.length,
      });
    }
  }, [analysisPoints]);

  return (
    <div className={classnames("breakpoint-navigation", { empty: isEmpty })}>
      {!isEmpty ? (
        <BreakpointNavigationCommands prev={prev} next={next} navigateToPoint={navigateToPoint} />
      ) : null}
      {analysisPoints && !analysisPoints.error ? (
        <BreakpointTimeline breakpoint={breakpoint} setZoomedBreakpoint={setZoomedBreakpoint} />
      ) : (
        <div className="flex-grow" />
      )}
      <div className="text-center">
        {editing && (
          <button
            className={classnames(
              "h-5 w-5 rounded-full border p-px pt-0.5",
              showCondition
                ? "border-primaryAccent text-primaryAccent"
                : "border-gray-500 text-gray-500"
            )}
            style={{ height: "1.25rem", borderRadius: "100%" }}
            onClick={() => setShowCondition(!showCondition)}
          >
            <MaterialIcon>filter_list</MaterialIcon>
          </button>
        )}
        {!editing && (
          <BreakpointNavigationStatus
            indexed={indexed}
            executionPoint={lastExecutionPoint}
            analysisPoints={analysisPoints}
          />
        )}
      </div>
    </div>
  );
}

function BreakpointNavigationCommands({ prev, next, navigateToPoint }) {
  const prevDisabled = !prev;
  const nextDisabled = !next;
  return (
    <div className="breakpoint-navigation-commands">
      <button
        className={`breakpoint-navigation-command-prev ${prevDisabled ? " disabled" : ""}`}
        title={prev ? "Jump Back (to previous hit)" : "No previous hit to jump to"}
        disabled={prevDisabled}
        onClick={() => navigateToPoint(prev)}
      >
        <div className="img rewind" />
      </button>
      <button
        className={`breakpoint-navigation-command-next ${nextDisabled || !next ? " disabled" : ""}`}
        title={next ? "Jump Forward (to next hit)" : "No next hit to jump to"}
        disabled={nextDisabled}
        onClick={() => navigateToPoint(next)}
      >
        <div className="img rewind" style={{ transform: "rotate(180deg)" }} />
      </button>
    </div>
  );
}

function BreakpointNavigationStatus({ executionPoint, analysisPoints, indexed }) {
  let status = "";
  let maxStatusLength = 0;
  if (!indexed) {
    status = "Indexing";
  } else if (!analysisPoints || !executionPoint) {
    status = "Loading";
  } else if (analysisPoints.error) {
    // This error is currently caused by how the backend limits the returned
    // hits to 10k. Lines with more than 10k hits don't get returned.
    status = "10k+ hits";
  } else if (analysisPoints.data.length == 0) {
    status = "No hits";
  } else {
    const points = analysisPoints
      ? analysisPoints.data.filter(point => BigInt(point.point) <= BigInt(executionPoint))
      : [];

    status = `${points.length}/${analysisPoints.data.length}`;
    maxStatusLength = `${analysisPoints.length}/${analysisPoints.data.length}`.length;
  }

  return (
    <div className={classnames("breakpoint-navigation-status-container")}>
      <div className="text-breakpointStatus rounded-2xl bg-breakpointStatusBG px-3 py-0.5">
        <div className="text-center" style={{ minWidth: `${maxStatusLength}ch` }}></div>
        {status}
      </div>
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
