import React from "react";
import { getLeftOffset } from "../../utils/timeline";
import { connect } from "react-redux";
import classnames from "classnames";
import { actions } from "../../actions";
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

class Marker extends React.Component {
  shouldComponentUpdate(nextProps) {
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

  getIsSecondaryHighlighted(hoveredPoint) {
    const { frame } = this.props;

    if (!frame || !hoveredPoint?.location) {
      return false;
    }

    return getLocationKey(hoveredPoint.location) == getLocationKey(frame);
  }

  onClick = e => {
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
      target: "timeline",
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
          "secondary-highlight": this.getIsSecondaryHighlighted(),
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

export default connect(null, {
  setHoveredPoint: actions.setHoveredPoint,
  seek: actions.seek,
})(Marker);
