import classnames from "classnames";
import React from "react";
import { ConnectedProps, connect } from "react-redux";

import { Comment } from "shared/graphql/types";
import { actions } from "ui/actions";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import { trackEvent } from "ui/utils/telemetry";
import { getMarkerLeftOffset } from "ui/utils/timeline";

const markerWidth = 19;

interface CommentMarkerProps extends PropsFromRedux {
  comment: Comment;
  comments: Comment[];
  isPrimaryHighlighted: boolean;
}

class CommentMarker extends React.Component<CommentMarkerProps> {
  calculateLeftOffset(time: number) {
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

  onClick = (e: React.MouseEvent) => {
    // This should not count as a click on the timeline, which would seek to a particular time.
    e.stopPropagation();
    const { comment, seekToComment } = this.props;
    trackEvent("timeline.comment_select");
    seekToComment(comment, false);
  };

  render() {
    const { comment, currentTime, zoomRegion, isPrimaryHighlighted } = this.props;

    const { time } = comment;

    if (!time || time > zoomRegion.endTime) {
      return null;
    }

    const pausedAtComment = currentTime == time;

    return (
      <div
        className={classnames("img comment-marker", {
          paused: pausedAtComment,
          "primary-highlight": isPrimaryHighlighted,
        })}
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
    timelineDimensions: selectors.getTimelineDimensions(state),
    zoomRegion: selectors.getZoomRegion(state),
    currentTime: selectors.getCurrentTime(state),
  }),
  {
    seekToComment: actions.seekToComment,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(CommentMarker);
