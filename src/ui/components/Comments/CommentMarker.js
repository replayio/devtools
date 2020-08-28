import React from "react";
import { connect } from "react-redux";
import classnames from "classnames";

import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import {
  getPixelOffset,
  getCommentLeftOffset,
  getMarkerLeftOffset,
  getTimeMidpoint,
} from "ui/utils/timeline";
import Dropdown from "devtools/client/debugger/src/components/shared/Dropdown";

const markerWidth = 15;
const tolerance = 2;

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

  getCommentAtTime(time) {
    const { comments, currentTime } = this.props;
    const index = comments.findIndex(comment => comment.time === currentTime);

    return comments[index];
  }

  getIsCloseToHover(commentTime, hoverTime, tolerance) {
    const { timelineDimensions, zoomRegion } = this.props;

    const commentMidpoint = getTimeMidpoint({
      time: commentTime,
      overlayWidth: timelineDimensions.width,
      zoom: zoomRegion,
    });
    const hoverMidpoint = getTimeMidpoint({
      time: hoverTime,
      overlayWidth: timelineDimensions.width,
      zoom: zoomRegion,
    });

    return Math.abs(commentMidpoint - hoverMidpoint) < tolerance;
  }

  renderCreateCommentButton() {
    const { createComment, currentTime } = this.props;

    if (this.getCommentAtTime(currentTime)) {
      return null;
    }

    return (
      <button
        className={classnames("create-comment")}
        style={{
          left: `${this.calculateLeftOffset(currentTime)}%`,
        }}
        onClick={() => createComment(null, true, "timeline")}
      ></button>
    );
  }

  render() {
    const { comment, showComment, currentTime, hoverTime } = this.props;

    if (!comment) {
      return this.renderCreateCommentButton();
    }

    const { time, visible, id } = comment;
    const pausedAtComment = currentTime == time;

    // If a comment is close enough to the hovered time, we give
    // it the same hovered styling as a comment with exact time match.
    // The tolerance here is +/- 2% relative to the timeline's width.
    const isCloseToHover = this.getIsCloseToHover(time, hoverTime, tolerance);

    return (
      <button
        className={classnames("img comment-marker", {
          hovered: isCloseToHover,
          expanded: visible,
          paused: pausedAtComment,
        })}
        style={{
          left: `${this.calculateLeftOffset(time)}%`,
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
    comments: selectors.getComments(state),
  }),
  {
    createComment: actions.createComment,
    showComment: actions.showComment,
  }
)(CommentMarker);
