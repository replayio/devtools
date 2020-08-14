import ReactDOM from "react-dom";
import React from "react";
import { connect } from "react-redux";
import classnames from "classnames";

import { actions } from "../../actions";
import { selectors } from "../../reducers";
import { features } from "../../utils/prefs";
import { getPixelOffset, getLeftOffset } from "../../utils/timeline";

import "./Comments.css";

class Comment extends React.Component {
  onClickMarker = () => {
    this.props.set;
  };
  render() {
    const { comment, zoomRegion, index, overlayWidth, showComment } = this.props;

    const offset = getPixelOffset({
      time: comment.time,
      overlayWidth,
      zoom: zoomRegion,
    });

    const leftOffset = getLeftOffset({
      time: comment.time,
      overlayWidth,
      zoom: zoomRegion,
    });

    if (offset < 0) {
      return null;
    }

    if (!comment.visible) {
      return (
        <div
          className="comment-marker"
          key={comment.id}
          style={{
            left: `${leftOffset}%`,
          }}
          onClick={() => showComment(comment)}
        ></div>
      );
    }

    return (
      <div
        className={classnames("comment", {})}
        key={comment.id}
        style={{
          left: `${leftOffset}%`,
          zIndex: `${index + 100}`,
        }}
      >
        <div className="comment-body">
          <div className="comment-avatar">J</div>
          <div className="comment-content">
            <div className="comment-header">
              <div className="comment-user">Jaril</div>
              <div className="comment-date">Today at 12:04am</div>
            </div>
            <div className="comment-description">
              You can use Constraints to define how objects respond in scrolling Prototypes. Learn
              more about Prototyping in Figma.
            </div>
          </div>
        </div>
      </div>
    );
  }
}

class Comments extends React.Component {
  get overlayWidth() {
    return this.props.timelineDimensions?.width || 1;
  }
  render() {
    const { comments, zoomRegion, showComment } = this.props;
    if (!features.comments) {
      return null;
    }
    return (
      <div className="comments">
        <div className="comments-container">
          {comments.map((comment, index) => (
            <Comment
              comment={comment}
              index={index}
              overlayWidth={this.overlayWidth}
              zoomRegion={zoomRegion}
              showComment={showComment}
            />
          ))}
        </div>
      </div>
    );
  }
}

export default connect(
  state => ({
    comments: selectors.getComments(state),
    timelineDimensions: selectors.getTimelineDimensions(state),
    zoomRegion: selectors.getZoomRegion(state),
  }),
  {
    showComment: actions.showComment,
  }
)(Comments);
