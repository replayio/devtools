import ReactDOM from "react-dom";
import React from "react";
import { connect } from "react-redux";
import classnames from "classnames";
import CommentMarker from "./CommentMarker";

import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { getPixelOffset, getCommentLeftOffset, getMarkerLeftOffset } from "ui/utils/timeline";
import Dropdown from "devtools/client/debugger/src/components/shared/Dropdown";
import CommentEditor from "./CommentEditor";

class Comment extends React.Component {
  state = {
    editing: false,
  };

  componentDidMount() {
    const { contents, addedFrom } = this.props.comment;
    const { editing } = this.state;

    // A newly-added (empty) comment from the Timeline's create comment button
    // should directly go into editing mode.
    if (!contents && addedFrom == "timeline") {
      this.startEditing();
    }
  }

  componentDidUpdate() {
    // Clear the editing state whenever a timeline comment is collapsed
    // into its marker.
    if (this.state.editing && !this.props.comment.visible) {
      this.stopEditing();
    }
  }

  startEditing = () => {
    this.setState({ editing: true });
  };

  stopEditing = () => {
    this.setState({ editing: false });
  };

  removeComment = () => {
    const { removeComment, comment } = this.props;
    removeComment(comment);
  };

  renderDropdownPanel() {
    return (
      <div className="dropdown-panel">
        {!this.state.editing ? (
          <div className="menu-item" onClick={this.startEditing}>
            Edit Comment
          </div>
        ) : null}
        <div className="menu-item" onClick={this.removeComment}>
          Delete Comment
        </div>
      </div>
    );
  }

  renderCommentMarker(leftOffset) {
    const { comment, showComment, currentTime } = this.props;
    const pausedAtComment = currentTime == comment.time;

    return (
      <button
        className={classnames("img comment-marker", {
          expanded: comment.visible,
          paused: pausedAtComment,
        })}
        style={{
          left: `calc(${leftOffset}%)`,
        }}
        onClick={() => showComment(comment)}
      ></button>
    );
  }

  renderLabel() {
    const { comment } = this.props;
    const lines = comment.contents.split("\n");

    return (
      <div className="label" onDoubleClick={this.startEditing}>
        {lines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    );
  }

  renderCommentBody() {
    const { editing } = this.state;
    const { comment } = this.props;

    return (
      <div className="comment-body">
        <div className="comment-content">
          <div className="comment-header">
            <div className="actions">
              <Dropdown panel={this.renderDropdownPanel()} icon={<div>⋯</div>} />
            </div>
          </div>
          <div className="comment-description">
            {editing ? (
              <CommentEditor comment={comment} stopEditing={this.stopEditing} />
            ) : (
              this.renderLabel()
            )}
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { comment, zoomRegion, index, timelineDimensions } = this.props;
    const { description } = this.state;

    const commentWidth = 280;

    const offset = getPixelOffset({
      time: comment.time,
      overlayWidth: timelineDimensions.width,
      zoom: zoomRegion,
    });
    const commentLeftOffset = getCommentLeftOffset({
      time: comment.time,
      overlayWidth: timelineDimensions.width,
      zoom: zoomRegion,
      commentWidth: commentWidth,
    });

    if (offset < 0) {
      return null;
    }

    if (!comment.visible) {
      return <CommentMarker comment={comment} />;
    }

    return (
      <div>
        <CommentMarker comment={comment} />
        <div
          className={classnames("comment")}
          style={{
            left: `${commentLeftOffset}%`,
            zIndex: `${index + 100}`,
            width: `${commentWidth}px`,
          }}
        >
          {this.renderCommentBody()}
        </div>
      </div>
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
    showComment: actions.showComment,
    updateComment: actions.updateComment,
    removeComment: actions.removeComment,
  }
)(Comment);
