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

  onClick = () => {
    const { setFocusedCommentId, comment, seek } = this.props;
    const { id, time, point, has_frames } = comment;

    setFocusedCommentId(comment.id);
    seek(point, time, has_frames);
  };

  render() {
    const { comment, comments, currentTime, zoomRegion, focusedCommentId } = this.props;

    if (!comment) {
      return <NewCommentButton comments={comments} />;
    }

    if (comment.time > zoomRegion.endTime) {
      return null;
    }

    const { time, id } = comment;
    const pausedAtComment = currentTime == time;

    // If a comment is newly added and doesn't have any content yet,
    // hide it until the user saves it with new content. This way
    // we avoid flickering in the UI in case they press cancel and
    // we have to delete the comment.
    const hidden = !comment.content;

    return (
      <button
        className={classnames("img comment-marker", {
          expanded: id === focusedCommentId,
          paused: pausedAtComment,
          hidden,
        })}
        style={{
          left: `${this.calculateLeftOffset(time)}%`,
        }}
        onClick={this.onClick}
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
    setFocusedCommentId: actions.setFocusedCommentId,
    seek: actions.seek,
  }
)(CommentMarker);
