import React, { MouseEventHandler } from "react";
const { getLeftOffset } = require("../../utils/timeline");
import { connect, ConnectedProps } from "react-redux";
const classnames = require("classnames");
import { actions } from "../../actions";
import { ZoomRegion } from "ui/state/timeline";
import { Location, PauseId } from "@recordreplay/protocol";

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
  isPrimaryHighlighted: boolean;
  isSecondaryHighlighted: boolean;
  zoomRegion: ZoomRegion;
  overlayWidth: number;
  pauseId?: PauseId;
  onSeek: () => void;
};

class Marker extends React.Component<MarkerProps> {
  shouldComponentUpdate(nextProps: Readonly<MarkerProps>) {
    const isHighlighted = this.props.isPrimaryHighlighted || this.props.isSecondaryHighlighted;
    const willBeHighlighted = nextProps.isPrimaryHighlighted || nextProps.isSecondaryHighlighted;

    return (
      this.props.time !== nextProps.time ||
      this.props.overlayWidth !== nextProps.overlayWidth ||
      this.props.zoomRegion !== nextProps.zoomRegion ||
      isHighlighted !== willBeHighlighted
    );
  }

  onClick: MouseEventHandler = e => {
    const { seek, point, time, hasFrames, pauseId, onSeek } = this.props;

    e.preventDefault();
    e.stopPropagation();

    seek(point, time, hasFrames, pauseId);
    onSeek();
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
    const {
      time,
      currentTime,
      isPrimaryHighlighted,
      isSecondaryHighlighted,
      zoomRegion,
      overlayWidth,
    } = this.props;

    return (
      <a
        tabIndex={0}
        className={classnames("marker", {
          "primary-highlight": isPrimaryHighlighted,
          "secondary-highlight": isSecondaryHighlighted,
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
  setActiveComment: actions.setActiveComment,
});
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(Marker);
