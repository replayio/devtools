import React, { useState, useRef, useMemo } from "react";
import classnames from "classnames";
import { PointDescription } from "@replayio/protocol";

import { actions as UIActions } from "ui/actions";
import { selectors } from "ui/reducers";
import { timelineMarkerWidth as pointWidth } from "ui/constants";
import BreakpointTimelinePoint from "./BreakpointTimelinePoint";
import { getVisiblePosition } from "ui/utils/timeline";
import PortalTooltip from "ui/components/shared/PortalTooltip";
import { mostRecentPaintOrMouseEvent } from "protocol/graphics";

import {
  getAnalysisPointsForLocation,
  LocationAnalysisSummary,
} from "devtools/client/debugger/src/reducers/breakpoints";
import TimeTooltip from "devtools/client/debugger/src/components/SecondaryPanes/Breakpoints/TimeTooltip";
import { UIState } from "ui/state";
import { connect, ConnectedProps } from "react-redux";
import { useAppSelector } from "ui/setup/hooks";
import { HoveredItem } from "ui/state/timeline";
import { getExecutionPoint } from "../../../selectors";
import type { Breakpoint } from "../../../reducers/types";
import UnfocusedRegion from "ui/components/Timeline/UnfocusedRegion";
import NonLoadingRegions from "ui/components/Timeline/NonLoadingRegions";
import { UnloadedRegions } from "ui/components/Timeline/UnloadedRegions";

function Points({
  analysisPoints,
  breakpoint,
  hoveredItem,
}: {
  analysisPoints: LocationAnalysisSummary;
  breakpoint: any;
  hoveredItem: HoveredItem | null;
}) {
  const executionPoint = useAppSelector(getExecutionPoint);
  const duration = useAppSelector(selectors.getRecordingDuration);
  const displayedPoints = useMemo(() => {
    if (!duration) {
      // We haven't loaded yet, bailing early
      return [];
    }
    let previousDisplayed: PointDescription;
    return analysisPoints.data?.filter(p => {
      if (
        !previousDisplayed ||
        executionPoint === p.point ||
        p.time - previousDisplayed.time > duration * 0.01
      ) {
        previousDisplayed = p;
        return true;
      }
      return false;
    });
  }, [analysisPoints.data, executionPoint, duration]);

  return (
    <>
      {displayedPoints?.map((p, i) => (
        <BreakpointTimelinePoint
          breakpoint={breakpoint}
          point={p}
          key={i}
          index={i}
          hoveredItem={hoveredItem}
        />
      ))}
    </>
  );
}

type BreakpointTimelineProps = PropsFromRedux & {
  breakpoint: any;
};

function BreakpointTimeline({
  breakpoint,
  analysisPoints,
  zoomRegion,
  currentTime,
  hoveredItem,
  seek,
}: BreakpointTimelineProps) {
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const onClick = (e: React.MouseEvent) => {
    if (!hoveredTime) {
      return;
    }

    const event = mostRecentPaintOrMouseEvent(hoveredTime);
    if (event && event.point) {
      seek(event.point, hoveredTime, false);
    }
  };
  const onMouseMove = (e: React.MouseEvent) => {
    const { beginTime, endTime } = zoomRegion;
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const clickLeft = e.clientX;

    const clickPosition = Math.max((clickLeft - left) / width, 0);
    const time = Math.ceil(beginTime + (endTime - beginTime) * clickPosition);
    setHoveredTime(time);
  };
  const onMouseLeave = (e: React.MouseEvent) => setHoveredTime(null);

  const hoverPercent = `${getVisiblePosition({ time: hoveredTime, zoom: zoomRegion }) * 100}%`;
  const percent = getVisiblePosition({ time: currentTime, zoom: zoomRegion }) * 100;

  return (
    <div className="breakpoint-navigation-timeline-container relative">
      <PortalTooltip tooltip={<TimeTooltip time={hoveredTime} />} followX={true}>
        <div
          className={classnames("breakpoint-navigation-timeline relative cursor-pointer")}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          onClick={onClick}
          ref={timelineRef}
          style={{ height: `${pointWidth + 2}px` }} // 2px to account for the 1px top+bottom border
        >
          <div className="progress-line full" />
          <div className="progress-line preview-min" style={{ width: hoverPercent }} />
          <div className="progress-line" style={{ width: `${percent}%` }} />
          <UnloadedRegions />
          {analysisPoints && !analysisPoints.error ? (
            <Points
              analysisPoints={analysisPoints}
              breakpoint={breakpoint}
              hoveredItem={hoveredItem}
            />
          ) : null}
        </div>
      </PortalTooltip>
    </div>
  );
}

const connector = connect(
  (state: UIState, { breakpoint }: { breakpoint: Breakpoint }) => ({
    analysisPoints: getAnalysisPointsForLocation(
      state,
      breakpoint.location,
      breakpoint.options.condition
    ),
    currentTime: selectors.getCurrentTime(state),
    hoveredItem: selectors.getHoveredItem(state),
    zoomRegion: selectors.getZoomRegion(state),
  }),
  {
    seek: UIActions.seek,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(BreakpointTimeline);
