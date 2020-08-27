import React from "react";
import { connect } from "react-redux";
import classnames from "classnames";

import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { getPixelOffset, getCommentLeftOffset, getMarkerLeftOffset } from "ui/utils/timeline";
import Dropdown from "devtools/client/debugger/src/components/shared/Dropdown";

const markerWidth = 15;

class CommentMarker extends React.Component {
  calculateLeftOffset(time) {
    const { timelineDimensions, zoomRegion } = this.props;

    return getMarkerLeftOffset({
      time: time,
      overlayWidth: timelineDimensions.width,
      zoom: zoomRegion,
      markerWidth: markerWidth,
    });
  }

  render() {
    const { comment, showComment, createComment, currentTime, hoverTime } = this.props;

    if (!comment) {
      return (
        <button
          className={classnames("create-comment")}
          style={{
            left: `calc(${this.calculateLeftOffset(currentTime)}%)`,
          }}
          onClick={() => createComment(null, true, "timeline")}
        ></button>
      );
    }

    const { time, visible, id } = comment;
    const pausedAtComment = currentTime == time;
    const hoveredCloseToCommentTime = Math.abs(hoverTime - time) < 50;

    return (
      <button
        className={classnames("img comment-marker", {
          hovered: hoveredCloseToCommentTime,
          expanded: visible,
          paused: pausedAtComment,
        })}
        key={id}
        style={{
          left: `calc(${this.calculateLeftOffset(time)}%)`,
        }}
        onClick={() => showComment(comment)}
      ></button>
    );
  }
}

export default connect(
  state => ({
    timelineDimensions: selectors.getTimelineDimensions(state),
    zoomRegion: selectors.getZoomRegion(state),
    currentTime: selectors.getCurrentTime(state),
    hoverTime: selectors.getHoverTime(state),
  }),
  {
    createComment: actions.createComment,
    showComment: actions.showComment,
  }
)(CommentMarker);
