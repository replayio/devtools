import { PointDescription, TimeStampedPoint } from "@replayio/protocol";
import classnames from "classnames";
import { Breakpoint } from "devtools/client/debugger/src/reducers/types";
import { getExecutionPoint } from "devtools/client/debugger/src/selectors";
import findLast from "lodash/findLast";
import { compareNumericStrings } from "protocol/utils";
import React, { Suspense, useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";
import { HitPointStatus } from "shared/client/types";
import { actions } from "ui/actions";
import Icon from "ui/components/shared/Icon";
import type { UIState } from "ui/state";
import { trackEvent } from "ui/utils/telemetry";

import BreakpointTimeline from "./BreakpointTimeline";
import { PanelStatus } from "./PanelStatus";

type ExternalProps = {
  breakpoint: Breakpoint;
  editing: boolean;
  hitPoints: TimeStampedPoint[] | null;
  hitPointStatus: HitPointStatus | null;
  showCondition: boolean;
  setShowCondition: (showCondition: boolean) => void;
};

const connector = connect(
  (state: UIState) => ({
    executionPoint: getExecutionPoint(state),
  }),
  {
    seek: actions.seek,
  }
);

type PropsFromRedux = ConnectedProps<typeof connector>;

function BreakpointNavigation({
  breakpoint,
  editing,
  executionPoint,
  hitPoints,
  hitPointStatus,
  seek,
  setShowCondition,
  showCondition,
}: PropsFromRedux & ExternalProps) {
  const error = hitPointStatus === "too-many-points-to-find";
  const isEmpty = hitPoints === null || hitPoints.length === 0;

  const navigateToPoint = (point?: PointDescription) => {
    trackEvent("breakpoint.navigate");
    if (point) {
      seek(point.point, point.time, true);
    }
  };

  let next, prev;

  if (executionPoint && !error && !isEmpty) {
    prev = findLast(hitPoints, p => compareNumericStrings(p.point, executionPoint) < 0);
    next = hitPoints.find(p => compareNumericStrings(p.point, executionPoint) > 0);
  }

  useEffect(() => {
    if (!error && hitPoints !== null) {
      trackEvent(hitPoints.length > 0 ? "breakpoint.has_hits" : "breakpoint.no_hits", {
        hits: hitPoints.length,
      });
    }
  }, [error, hitPoints]);

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
      <BreakpointNavigationCommands prev={prev} next={next} navigateToPoint={navigateToPoint} />
      {!error && hitPoints ? (
        <BreakpointTimeline
          breakpoint={breakpoint}
          hitPoints={hitPoints}
          hitPointStatus={hitPointStatus!}
        />
      ) : (
        <div className="flex-grow" />
      )}
      <div className="text-center">
        <PanelStatus
          hitPoints={hitPoints}
          hitPointStatus={hitPointStatus}
          prefixBadge={breakpoint.options.prefixBadge!}
        />
      </div>
    </div>
  );
}

function BreakpointNavigationCommands({
  prev,
  next,
  navigateToPoint,
}: {
  prev?: PointDescription;
  next?: PointDescription;
  navigateToPoint: (point?: PointDescription) => void;
}) {
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

const ConnectedBreakpointNavigation = connector(BreakpointNavigation);

function Loader() {
  return <div className="breakpoint-navigation empty justify-between p-1.5">Loading</div>;
}

export default function SuspendingBreakpointNavigation(props: ExternalProps) {
  return (
    <Suspense fallback={<Loader />}>
      <ConnectedBreakpointNavigation {...props} />
    </Suspense>
  );
}
