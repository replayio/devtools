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
  render() {
    const { comment, zoomRegion, index, overlayWidth } = this.props;

    const offset = getPixelOffset({
      time: comment.executionPointTime,
      overlayWidth,
      zoom: zoomRegion,
    });

    if (offset < 0) {
      return null;
    }

    return (
      <a
        className={classnames("comment", {})}
        style={{
          left: `${getLeftOffset({
            time: comment.time,
            overlayWidth,
            zoom: zoomRegion,
          })}%`,
          zIndex: `${index + 100}`,
        }}
      />
    );
  }
}

class Comments extends React.Component {
  get overlayWidth() {
    return this.props.timelineDimensions?.width || 1;
  }
  render() {
    const { comments, zoomRegion } = this.props;
    if (!features.comments) {
      return null;
    }
    return (
      <div className="comments">
        <div className="comments-container">
          {comments.map((comment, index) => (
            <Comment
              key={comment.id}
              comment={comment}
              index={index}
              overlayWidth={this.overlayWidth}
              zoomRegion={zoomRegion}
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
  {}
)(Comments);
