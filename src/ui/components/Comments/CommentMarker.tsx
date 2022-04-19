import classnames from "classnames";
import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import { Comment, PendingComment } from "ui/state/comments";
import { trackEvent } from "ui/utils/telemetry";
import { getMarkerLeftOffset } from "ui/utils/timeline";

const markerWidth = 19;

interface CommentMarkerProps extends PropsFromRedux {
  comment: Comment | PendingComment["comment"];
  comments: (Comment | PendingComment["comment"])[];
  isPrimaryHighlighted: boolean;
}

class CommentMarker extends React.Component<CommentMarkerProps> {
  calculateLeftOffset(time: number) {
    const { timelineDimensions, zoomRegion } = this.props;

    return getMarkerLeftOffset({
      markerWidth: markerWidth,
      overlayWidth: timelineDimensions.width,
      time: time,
      zoom: zoomRegion,
    });
  }

  getCommentAtTime() {
    const { comments, currentTime } = this.props;
    const index = comments.findIndex(comment => comment.time === currentTime);

    return comments[index];
  }

  onClick = () => {
    const { comment, seekToComment } = this.props;
    trackEvent("timeline.comment_select");
    seekToComment(comment);
  };

  render() {
    const { comment, currentTime, zoomRegion, setHoveredComment, isPrimaryHighlighted } =
      this.props;

    // We don't want to show the replies on the timeline
    // just the parent comment.
    if ("parentId" in comment && comment.parentId) {
      return null;
    }

    if (!comment.time || comment.time > zoomRegion.endTime) {
      return null;
    }

    const { time } = comment;
    const pausedAtComment = currentTime == time;

    return (
      <div
        className={classnames("img comment-marker", {
          paused: pausedAtComment,
          "primary-highlight": isPrimaryHighlighted,
        })}
        onMouseEnter={() => setHoveredComment((comment as any).id)}
        onMouseLeave={() => setHoveredComment(null)}
        style={{
          left: `${this.calculateLeftOffset(time)}%`,
        }}
        onClick={this.onClick}
      />
    );
  }
}

const connector = connect(
  (state: UIState) => ({
    currentTime: selectors.getCurrentTime(state),
    timelineDimensions: selectors.getTimelineDimensions(state),
    zoomRegion: selectors.getZoomRegion(state),
  }),
  {
    seekToComment: actions.seekToComment,
    setHoveredComment: actions.setHoveredComment,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(CommentMarker);
