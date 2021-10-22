import React, { useState, useRef } from "react";
import classnames from "classnames";

import { actions as UIActions } from "ui/actions";
import { selectors } from "ui/reducers";
import { timelineMarkerWidth as pointWidth } from "ui/constants";
const BreakpointTimelinePoint = require("./BreakpointTimelinePoint");
const { isMatchingLocation } = require("devtools/client/debugger/src/utils/breakpoint");
const { prefs } = require("ui/utils/prefs");
import { getVisiblePosition } from "ui/utils/timeline";
import PortalTooltip from "ui/components/shared/PortalTooltip";
import { mostRecentPaintOrMouseEvent } from "protocol/graphics";

import TimeTooltip from "devtools/client/debugger/src/components/SecondaryPanes/Breakpoints/TimeTooltip";
import { UIState } from "ui/state";
import { connect, ConnectedProps } from "react-redux";
import { PointDescription } from "@recordreplay/protocol";
import { HoveredItem } from "ui/state/timeline";

function Points({
  analysisPoints,
  hoveredItem,
  breakpoint,
}: {
  breakpoint: any;
  analysisPoints: PointDescription[];
  hoveredItem: HoveredItem | null;
}) {
  if (analysisPoints.length > prefs.maxHitsDisplayed) return null;

  return (
    <>
      {analysisPoints.map((p, i) => (
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
type Coordinates = {
  x: number;
  y: number;
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
  const [hoveredCoordinates, setHoveredCoordinates] = useState<Coordinates | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);

  const onMouseMove = (e: React.MouseEvent) => {
    const { startTime, endTime } = zoomRegion;
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const clickLeft = e.clientX;

    const clickPosition = Math.max((clickLeft - left) / width, 0);
    const time = Math.ceil(startTime + (endTime - startTime) * clickPosition);
    setHoveredTime(time);
    setHoveredCoordinates({ x: e.clientX, y: e.clientY });
  };
  const onMouseLeave = (e: React.MouseEvent) => {
    setHoveredTime(null);
    setHoveredCoordinates(null);
  };
  const onClick = (e: React.MouseEvent) => {
    if (!hoveredTime) return;

    const event = mostRecentPaintOrMouseEvent(hoveredTime);
    if (event && event.point) {
      seek(event.point, hoveredTime, false);
    }
  };

  const shouldDim =
    hoveredItem?.location && !isMatchingLocation(hoveredItem?.location, breakpoint.location);
  const hoverPercent = `${getVisiblePosition({ time: hoveredTime, zoom: zoomRegion }) * 100}%`;
  const percent = getVisiblePosition({ time: currentTime, zoom: zoomRegion }) * 100;

  return (
    <div className="breakpoint-navigation-timeline-container relative">
      <div
        className={classnames("breakpoint-navigation-timeline relative cursor-pointer", {
          dimmed: shouldDim,
        })}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        ref={timelineRef}
        style={{ height: `${pointWidth + 2}px` }} // 2px to account for the 1px top+bottom border
      >
        <div className="progress-line full" />
        <div className="progress-line preview-min" style={{ width: hoverPercent }} />
        <div className="progress-line" style={{ width: `${percent}%` }} />
        {analysisPoints && analysisPoints !== "error" ? (
          <Points
            analysisPoints={analysisPoints}
            breakpoint={breakpoint}
            hoveredItem={hoveredItem}
          />
        ) : null}
        {hoveredCoordinates && hoveredTime && timelineRef.current ? (
          <PortalTooltip targetCoordinates={hoveredCoordinates} targetElement={timelineRef.current}>
            <TimeTooltip time={hoveredTime} />
          </PortalTooltip>
        ) : null}
      </div>
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
    zoomRegion: selectors.getZoomRegion(state),
    currentTime: selectors.getCurrentTime(state),
    hoveredItem: selectors.getHoveredItem(state),
  }),
  {
    seek: UIActions.seek,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(BreakpointTimeline);
