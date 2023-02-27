import { Location, PauseId } from "@replayio/protocol";
import classnames from "classnames";
import React, { MouseEventHandler } from "react";
import { useAppDispatch } from "ui/setup/hooks";
import { actions } from "ui/actions/index";
import { timelineMarkerWidth as pointWidth } from "ui/constants";
import { HoveredItem, ZoomRegion } from "ui/state/timeline";
import { trackEvent } from "ui/utils/telemetry";
import { getVisiblePosition } from "ui/utils/timeline";

// If you do modify this, make sure you change EVERY single reference to this 11px width in
// the codebase. This includes, but is not limited to, the Timeline component, Message component,
// the timeline utilities, and the timeline styling.
export function Circle() {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle className="fill" cx="4.5" cy="4.5" r="4.5" fill="black" />
      {/* <circle cx="4.5" cy="4.5" r="4.5" stroke="black" strokeWidth="2" /> */}
      <circle className="stroke" cx="4.5" cy="4.5" r="5" stroke="black" strokeWidth="0" />
    </svg>
  );
}

type MarkerProps = {
  point: string;
  time: number;
  location?: Location;
  currentTime: number;
  isPrimaryHighlighted: boolean;
  zoomRegion: ZoomRegion;
  overlayWidth: number;
  pauseId?: PauseId;
};


const Marker = (props : MarkerProps) => {
  const appDispatch = useAppDispatch();
  const onClick: MouseEventHandler = e => {
    const { point, time, pauseId } = props;
    trackEvent("timeline.marker_select");

    e.preventDefault();
    e.stopPropagation();

    appDispatch( actions.seek(point, time, true, pauseId) );
  };

  const onMouseEnter = () => {
    const { point, time, location } = props;
    const hoveredItem: HoveredItem = {
      point,
      time,
      location,
      target: "timeline",
    };

    appDispatch( actions.setHoveredItem( hoveredItem ) );
  };

  const { time, currentTime, isPrimaryHighlighted, zoomRegion } = props;

  const offsetPercent = getVisiblePosition({ time, zoom: zoomRegion }) * 100;
  if (offsetPercent < 0 || offsetPercent > 100) {
    return null;
  }

  return (
    <a
      tabIndex={0}
      className={classnames("marker", {
        "primary-highlight": isPrimaryHighlighted,
        paused: time === currentTime,
      })}
      style={{
        left: `calc(${offsetPercent}% - ${pointWidth / 2}px)`,
      }}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      <Circle />
    </a>
  );
}


const shouldMarkerUpdate = (prevProps: Readonly<MarkerProps>, nextProps: Readonly<MarkerProps>) => {
  const highlightChanged = prevProps.isPrimaryHighlighted !== nextProps.isPrimaryHighlighted;

  return (
    highlightChanged ||
    prevProps.time !== nextProps.time ||
    prevProps.currentTime !== nextProps.currentTime ||
    prevProps.overlayWidth !== nextProps.overlayWidth ||
    prevProps.zoomRegion !== nextProps.zoomRegion
  );
}

export default React.memo( Marker, shouldMarkerUpdate );
