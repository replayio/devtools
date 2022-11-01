import { PointDescription, TimeStampedPoint } from "@replayio/protocol";
import classnames from "classnames";
import React, { MouseEvent, useMemo, useRef, useState } from "react";
import { ConnectedProps, connect } from "react-redux";

import TimeTooltip from "devtools/client/debugger/src/components/SecondaryPanes/Breakpoints/TimeTooltip";
import { getExecutionPoint } from "devtools/client/debugger/src/reducers/pause";
import { mostRecentPaintOrMouseEvent } from "protocol/graphics";
import { HitPointStatus } from "shared/client/types";
import { actions as UIActions } from "ui/actions";
import PortalTooltip from "ui/components/shared/PortalTooltip";
import { UnloadedRegions } from "ui/components/Timeline/UnloadedRegions";
import { timelineMarkerWidth as pointWidth } from "ui/constants";
import { selectors } from "ui/reducers";
import { useAppSelector } from "ui/setup/hooks";
import { UIState } from "ui/state";
import { HoveredItem } from "ui/state/timeline";
import { getVisiblePosition } from "ui/utils/timeline";

import BreakpointTimelinePoint from "./BreakpointTimelinePoint";

function Points({
  breakpoint,
  hitPoints,
  hoveredItem,
}: {
  breakpoint: any;
  hitPoints: TimeStampedPoint[];
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
    return hitPoints.filter(p => {
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
  }, [duration, executionPoint, hitPoints]);

  return (
    <>
      {displayedPoints?.map((p, i) => (
        <BreakpointTimelinePoint
          breakpoint={breakpoint}
          point={p}
          key={i}
          index={i}
          hitPoints={hitPoints}
          hoveredItem={hoveredItem}
        />
      ))}
    </>
  );
}

type BreakpointTimelineProps = PropsFromRedux & {
  breakpoint: any;
  hitPoints: TimeStampedPoint[];
  hitPointStatus: HitPointStatus;
};

function BreakpointTimeline({
  breakpoint,
  currentTime,
  hitPoints,
  hitPointStatus,
  hoveredItem,
  seek,
  zoomRegion,
}: BreakpointTimelineProps) {
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const onClick = () => {
    if (!hoveredTime) {
      return;
    }

    const event = mostRecentPaintOrMouseEvent(hoveredTime);
    if (event && event.point) {
      seek(event.point, hoveredTime, false);
    }
  };
  const onMouseMove = (event: MouseEvent) => {
    const { beginTime, endTime } = zoomRegion;
    const { left, width } = event.currentTarget.getBoundingClientRect();
    const clickLeft = event.clientX;

    const clickPosition = Math.max((clickLeft - left) / width, 0);
    const time = Math.ceil(beginTime + (endTime - beginTime) * clickPosition);
    setHoveredTime(time);
  };
  const onMouseLeave = () => setHoveredTime(null);

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
          {hitPointStatus !== "too-many-points-to-find" ? (
            <Points breakpoint={breakpoint} hitPoints={hitPoints} hoveredItem={hoveredItem} />
          ) : null}
        </div>
      </PortalTooltip>
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
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
