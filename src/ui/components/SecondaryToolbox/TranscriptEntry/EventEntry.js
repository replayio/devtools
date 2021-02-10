import React, { useEffect, useRef } from "react";
import classnames from "classnames";

import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import "./EventEntry.css";

function EventEntry({
  event,
  currentTime,
  index,
  seek,
  hoveredPoint,
  setHoveredPoint,
  activeComment,
  setActiveComment,
}) {
  const eventNode = useRef(null);

  useEffect(() => {
    if (hoveredPoint?.point == event.point && hoveredPoint?.target !== "transcript") {
      eventNode.current.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [hoveredPoint]);

  const seekToEvent = () => {
    const { point, time } = event;
    seek(point, time, false);
    setActiveComment(event);
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
      className={classnames("transcript-entry", {
        selected: activeComment === event,
        "primary-highlight": hoveredPoint?.point === event.point,
        paused: currentTime == event.time,
      })}
      key={index}
      ref={eventNode}
    >
      <span className="transcript-line" />
      <div className="transcript-entry-description">
        <div className="transcript-entry-icon">
          <div className="img event-click" />
        </div>
        <div className="transcript-entry-label">Mouse Click</div>
        <div className="event-timestamp">{`00:${Math.floor(event.time / 1000)
          .toString()
          .padStart(2, 0)}`}</div>
      </div>
    </div>
  );
}

export default connect(
  state => ({
    currentTime: selectors.getCurrentTime(state),
    hoveredPoint: selectors.getHoveredPoint(state),
    activeComment: selectors.getActiveComment(state),
  }),
  {
    setHoveredPoint: actions.setHoveredPoint,
    seek: actions.seek,
    setActiveComment: actions.setActiveComment,
  }
)(EventEntry);
