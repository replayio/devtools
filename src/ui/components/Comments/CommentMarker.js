import React from "react";
import { connect } from "react-redux";
import classnames from "classnames";

import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { getMarkerLeftOffset } from "ui/utils/timeline";

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

  getCommentAtTime() {
    const { comments, currentTime } = this.props;
    const index = comments.findIndex(comment => comment.time === currentTime);

    return comments[index];
  }

  onClick = () => {
    const { comment, seek } = this.props;
    const { time, point, has_frames } = comment;

    seek(point, time, has_frames);
  };

  render() {
    const { comment, comments, currentTime, zoomRegion, setHoveredComment } = this.props;

    // We don't want to show the replies on the timeline
    // just the parent comment.
    if (comment.parent_id) {
      return null;
    }

    if (comment.time > zoomRegion.endTime) {
      return null;
    }

    const { time, id } = comment;
    const pausedAtComment = currentTime == time;

    return (
      <button
        className={classnames("img comment-marker", {
          paused: pausedAtComment,
        })}
        onMouseEnter={() => setHoveredComment(comment.id)}
        onMouseLeave={() => setHoveredComment(null)}
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
  }),
  {
    seek: actions.seek,
    setHoveredComment: actions.setHoveredComment,
  }
)(CommentMarker);
