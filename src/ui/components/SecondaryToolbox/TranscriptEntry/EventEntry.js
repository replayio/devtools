import React from "react";
import classnames from "classnames";

import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";

function EventEntry({ event, currentTime, index, seek, hoveredPoint, setHoveredPoint }) {
  const seekToEvent = () => {
    const { point, time } = event;
    seek(point, time, false);
  };
  const onMouseLeave = () => {
    setHoveredPoint(null);
  };
  const onMouseEnter = () => {
    const { point, time, location } = event;
    const hoveredPoint = {
      point,
      time,
      location,
      target: "transcript",
    };

    setHoveredPoint(hoveredPoint);
  };

  return (
    <div
      onClick={seekToEvent}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={classnames("event", {
        selected: currentTime === event.time,
        "primary-highlight": hoveredPoint?.point === event.point,
      })}
      key={index}
    >
      <div className="img event-click" />
      <div className="item-label">Mouse Click</div>
    </div>
  );
}

export default connect(
  state => ({
    currentTime: selectors.getCurrentTime(state),
    hoveredPoint: selectors.getHoveredPoint(state),
  }),
  { setHoveredPoint: actions.setHoveredPoint, seek: actions.seek }
)(EventEntry);
