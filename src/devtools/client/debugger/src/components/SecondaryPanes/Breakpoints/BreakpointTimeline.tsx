import React, { useState, useRef, useMemo } from "react";
import classnames from "classnames";

import { actions as UIActions } from "ui/actions";
import { selectors } from "ui/reducers";
import { timelineMarkerWidth as pointWidth } from "ui/constants";
const BreakpointTimelinePoint = require("./BreakpointTimelinePoint").default;
import { getVisiblePosition } from "ui/utils/timeline";
import PortalTooltip from "ui/components/shared/PortalTooltip";
import { mostRecentPaintOrMouseEvent, precacheScreenshots } from "protocol/graphics";

import TimeTooltip from "devtools/client/debugger/src/components/SecondaryPanes/Breakpoints/TimeTooltip";
import { UIState } from "ui/state";
import { connect, ConnectedProps, useSelector } from "react-redux";
import { HoveredItem } from "ui/state/timeline";
import { UnloadedRegions } from "ui/components/Timeline/UnloadedRegions";
import { AnalysisPayload } from "ui/state/app";
import { PointDescription } from "@recordreplay/protocol";
import { getExecutionPoint } from "../../../selectors";

function Points({
  analysisPoints,
  breakpoint,
  hoveredItem,
}: {
  analysisPoints: AnalysisPayload;
  breakpoint: any;
  hoveredItem: HoveredItem | null;
}) {
  const executionPoint = useSelector(getExecutionPoint);
  const duration = useSelector(selectors.getRecordingDuration);
  const displayedPoints = useMemo(() => {
    if (!duration) {
      // We haven't loaded yet, bailing early
      return [];
    }
    let previousDisplayed: PointDescription;
    return analysisPoints.data.filter(p => {
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
    const { startTime, endTime } = zoomRegion;
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const clickLeft = e.clientX;

    const clickPosition = Math.max((clickLeft - left) / width, 0);
    const time = Math.ceil(startTime + (endTime - startTime) * clickPosition);
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
  (state: UIState, { breakpoint }: { breakpoint: any }) => ({
    analysisPoints: selectors.getAnalysisPointsForLocation(
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
