import React, { MouseEventHandler } from "react";
const { getLeftOffset } = require("../../utils/timeline");
import { connect, ConnectedProps } from "react-redux";
const { classnames } = require("classnames");
import { actions } from "../../actions";
import { HoveredPoint, ZoomRegion } from "ui/state/timeline";
import { Location, PauseId } from "@recordreplay/protocol";
import { getLocationKey } from "devtools/client/debugger/src/utils/breakpoint";

// If you do modify this, make sure you change EVERY single reference to this 11px width in
// the codebase. This includes, but is not limited to, the Timeline component, Message component,
// the timeline utilities, and the timeline styling.
export function Circle() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle className="fill" cx="5.5" cy="5.5" r="5.5" fill="black" />
      {/* <circle cx="5.5" cy="5.5" r="4.5" stroke="black" strokeWidth="2" /> */}
      <circle className="stroke" cx="5.5" cy="5.5" r="5" stroke="black" strokeWidth="0" />
    </svg>
  );
}

type MarkerProps = PropsFromRedux & {
  point: string;
  time: number;
  location?: Location;
  hasFrames: boolean;
  currentTime: number;
  hoveredPoint: HoveredPoint | null;
  zoomRegion: ZoomRegion;
  overlayWidth: number;
  pauseId?: PauseId;
};

class Marker extends React.Component<MarkerProps> {
  shouldComponentUpdate(nextProps: Readonly<MarkerProps>) {
    const { hoveredPoint, point } = this.props;

    const hoveredPointChanged = hoveredPoint !== nextProps.hoveredPoint;
    const isHighlighted =
      hoveredPoint?.point == point || this.getIsSecondaryHighlighted(hoveredPoint);
    const willBeHighlighted =
      nextProps.hoveredPoint?.point == point ||
      this.getIsSecondaryHighlighted(nextProps.hoveredPoint);

    if (hoveredPointChanged && !isHighlighted && !willBeHighlighted) {
      return false;
    }

    return true;
  }

  getIsSecondaryHighlighted(hoveredPoint: HoveredPoint | null) {
    const { location } = this.props;

    if (!location || !hoveredPoint?.location) {
      return false;
    }

    return getLocationKey(hoveredPoint.location) == getLocationKey(location);
  }

  onClick: MouseEventHandler = e => {
    const { seek, point, time, hasFrames, pauseId } = this.props;

    e.preventDefault();
    e.stopPropagation();

    seek(point, time, hasFrames, pauseId);
  };

  onMouseLeave = () => {
    this.props.setHoveredPoint(null);
  };

  onMouseEnter = () => {
    const { point, time, location, setHoveredPoint } = this.props;
    const hoveredPoint = {
      point,
      time,
      location,
      target: "timeline" as "timeline",
    };

    setHoveredPoint(hoveredPoint);
  };

  render() {
    const { time, point, currentTime, hoveredPoint, zoomRegion, overlayWidth } = this.props;

    return (
      <a
        tabIndex={0}
        className={classnames("marker", {
          "primary-highlight": hoveredPoint?.point === point,
          "secondary-highlight": this.getIsSecondaryHighlighted(hoveredPoint),
          paused: time === currentTime,
        })}
        style={{
          left: `${getLeftOffset({
            time: time,
            overlayWidth,
            zoom: zoomRegion,
          })}%`,
        }}
        onMouseEnter={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}
        onClick={this.onClick}
      >
        <Circle />
      </a>
    );
  }
}

const connector = connect(null, {
  setHoveredPoint: actions.setHoveredPoint,
  seek: actions.seek,
});
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(Marker);
