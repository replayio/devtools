import ReactDOM from "react-dom";
import React from "react";
import { connect } from "react-redux";

import Comment from "./Comment";
import CommentMarker from "./CommentMarker";
import { selectors } from "../../reducers";
import { features } from "../../utils/prefs";

import "./Comments.css";

class Comments extends React.Component {
  renderAddCommentButton() {
    return <CommentMarker />;
  }

  render() {
    const { comments, timelineDimensions } = this.props;

    return (
      <div className="comments" style={timelineDimensions}>
        <div className="comments-container">
          {comments.map((comment, index) => (
            <Comment key={comment.id} comment={comment} index={index} />
          ))}
          {this.renderAddCommentButton()}
        </div>
      </div>
    );
  }
}

export default connect(state => ({
  comments: selectors.getComments(state),
  timelineDimensions: selectors.getTimelineDimensions(state),
  zoomRegion: selectors.getZoomRegion(state),
}))(Comments);
