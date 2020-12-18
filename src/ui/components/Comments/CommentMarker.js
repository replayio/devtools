import React from "react";
import { connect } from "react-redux";
import classnames from "classnames";

import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { getMarkerLeftOffset } from "ui/utils/timeline";
import NewCommentButton from "./NewCommentButton";

const markerWidth = 19;

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

  render() {
    const {
      comment,
      comments,
      focusComment,
      currentTime,
      zoomRegion,
      focusedCommentId,
    } = this.props;

    if (!comment) {
      return <NewCommentButton comments={comments} />;
    }

    if (comment.time > zoomRegion.endTime) {
      return null;
    }

    const { time, id } = comment;
    const pausedAtComment = currentTime == time;

    return (
      <button
        className={classnames("img comment-marker", {
          expanded: id === focusedCommentId,
          paused: pausedAtComment,
        })}
        style={{
          left: `${this.calculateLeftOffset(time)}%`,
        }}
        onClick={() => focusComment(comment)}
      />
    );
  }
}

export default connect(
  state => ({
    timelineDimensions: selectors.getTimelineDimensions(state),
    zoomRegion: selectors.getZoomRegion(state),
    currentTime: selectors.getCurrentTime(state),
    focusedCommentId: selectors.getFocusedCommentId(state),
  }),
  {
    createComment: actions.createComment,
    focusComment: actions.focusComment,
  }
)(CommentMarker);
