import React, { useEffect, useRef } from "react";
import classnames from "classnames";
import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import "./TranscriptItem.css";

function TranscriptItem({
  item,
  icon,
  label,
  children,
  currentTime,
  index,
  seek,
  hoveredPoint,
  setHoveredPoint,
  activeComment,
  setActiveComment,
}) {
  const itemNode = useRef(null);

  useEffect(() => {
    if (hoveredPoint?.point == item.point && hoveredPoint?.target !== "transcript") {
      itemNode.current.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [hoveredPoint]);

  const seekToEvent = () => {
    const { point, time, hasFrames } = item;

    seek(point, time, hasFrames);
    setActiveComment(item);
  };
  const onMouseLeave = () => {
    setHoveredPoint(null);
  };
  const onMouseEnter = () => {
    const { point, time, location } = item;
    const hoveredPoint = {
      point,
      time,
      location,
      target: "transcript",
    };

    setHoveredPoint(hoveredPoint);
  };

  const { point, time } = item;

  return (
    <div
      onClick={seekToEvent}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={classnames("transcript-entry", {
        selected: activeComment === item && activeComment.content == "",
        "primary-highlight": hoveredPoint?.point === point,
        paused: currentTime == time,
        "before-paused": time < currentTime,
      })}
      key={index}
      ref={itemNode}
    >
      <span className="transcript-line" />
      <div className="transcript-entry-description">
        <div className="transcript-entry-icon">{icon}</div>
        <div className="transcript-entry-label">{label}</div>
        <div className="event-timestamp">{`00:${Math.floor(time / 1000)
          .toString()
          .padStart(2, 0)}`}</div>
      </div>
      {children}
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
)(TranscriptItem);
