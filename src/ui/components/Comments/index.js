import ReactDOM from "react-dom";
import React from "react";
import { connect } from "react-redux";

import Comment from "./Comment";
import CommentMarker from "./CommentMarker";
import { selectors } from "../../reducers";

import "./Comments.css";

class Comments extends React.Component {
  renderAddCommentButton() {
    return <CommentMarker />;
  }

  render() {
    const { comments, timelineDimensions, playback } = this.props;

    const sortedComments = comments.sort((a, b) => a.time - b.time);

    return (
      <div className="comments" style={timelineDimensions}>
        <div className="comments-container">
          {comments.map((comment, index) => (
            <Comment key={comment.id} comment={comment} index={index} />
          ))}
          {!playback ? this.renderAddCommentButton() : null}
        </div>
      </div>
    );
  }
}

export default connect(state => ({
  playback: selectors.getPlayback(state),
  comments: selectors.getComments(state),
  timelineDimensions: selectors.getTimelineDimensions(state),
  zoomRegion: selectors.getZoomRegion(state),
}))(Comments);
