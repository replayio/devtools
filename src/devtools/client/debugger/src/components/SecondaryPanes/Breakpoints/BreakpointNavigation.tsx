import classnames from "classnames";
import { PointDescription } from "@replayio/protocol";
import { connect, ConnectedProps } from "react-redux";
import find from "lodash/find";
import findLast from "lodash/findLast";
import { compareNumericStrings } from "protocol/utils";
import React, { useEffect } from "react";

import { getAnalysisPointsForLocation } from "devtools/client/debugger/src/reducers/breakpoints";
import { actions } from "ui/actions";
import PrefixBadgeButton from "ui/components/PrefixBadge";
import Icon from "ui/components/shared/Icon";
import { selectors } from "ui/reducers";
import type { UIState } from "ui/state";

import BreakpointTimeline from "./BreakpointTimeline";
import { PanelStatus } from "./PanelStatus";

import { trackEvent } from "ui/utils/telemetry";
import { Breakpoint } from "../../../reducers/types";
const mapStateToProps = (state: UIState, { breakpoint }: { breakpoint: Breakpoint }) => ({
  analysisPoints: getAnalysisPointsForLocation(
    state,
    // @ts-ignore Location / SourceLocation mismatch
    breakpoint.location,
    breakpoint.options.condition
  ),
  executionPoint: selectors.getExecutionPoint(state),
});

const connector = connect(mapStateToProps, {
  seek: actions.seek,
});

type PropsFromRedux = ConnectedProps<typeof connector>;
type BNProps = PropsFromRedux & {
  breakpoint: Breakpoint;
  editing: boolean;
  showCondition: boolean;
  setShowCondition: (showCondition: boolean) => void;
};

function BreakpointNavigation({
  analysisPoints,
  breakpoint,
  editing,
  executionPoint,
  seek,
  setShowCondition,
  showCondition,
}: BNProps) {
  const navigateToPoint = (point?: PointDescription) => {
    trackEvent("breakpoint.navigate");
    if (point) {
      seek(point.point, point.time, true);
    }
  };
  const points = analysisPoints?.data || [];
  const error = analysisPoints?.error;
  const isEmpty = error || points.length === 0;

  let next, prev;

  if (executionPoint && !error && points.length > 0) {
    prev = findLast(points, p => compareNumericStrings(p.point, executionPoint) < 0);
    next = find(points, p => compareNumericStrings(p.point, executionPoint) > 0);
  }

  useEffect(() => {
    if (analysisPoints) {
      trackEvent(points.length > 0 ? "breakpoint.has_hits" : "breakpoint.no_hits", {
        hits: points.length,
      });
    }
  }, [analysisPoints, points.length]);

  if (editing) {
    return (
      <div className="breakpoint-navigation justify-end space-x-1 p-1.5 py-2">
        <button className="" onClick={() => setShowCondition(!showCondition)}>
          <Icon
            filename="filter"
            className={classnames(showCondition ? "bg-primaryAccent" : "bg-gray-400")}
          />
        </button>
      </div>
    );
  }

  return (
    <div className={classnames("breakpoint-navigation justify-between p-1.5", { empty: isEmpty })}>
      {!isEmpty && !analysisPoints?.error ? (
        <BreakpointNavigationCommands prev={prev} next={next} navigateToPoint={navigateToPoint} />
      ) : null}
      {analysisPoints && !analysisPoints.error ? (
        <BreakpointTimeline breakpoint={breakpoint} />
      ) : (
        <div className="flex-grow" />
      )}
      <div className="text-center">
        <PanelStatus
          prefixBadge={breakpoint.options.prefixBadge!}
          analysisPoints={analysisPoints!}
        />
      </div>
    </div>
  );
}

interface BNCProps {
  prev?: PointDescription;
  next?: PointDescription;
  navigateToPoint: (point?: PointDescription) => void;
}

function BreakpointNavigationCommands({ prev, next, navigateToPoint }: BNCProps) {
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
        <div className="img rewind-rounded" />
      </button>
      <button
        className={`breakpoint-navigation-command-next ${nextDisabled || !next ? " disabled" : ""}`}
        title={next ? "Jump Forward (to next hit)" : "No next hit to jump to"}
        disabled={nextDisabled}
        onClick={() => navigateToPoint(next)}
      >
        <div className="img rewind-rounded" style={{ transform: "rotate(180deg)" }} />
      </button>
    </div>
  );
}

export default connector(BreakpointNavigation);
