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
    const { comment } = this.props;

    // A newly-added comment, which is initialized as empty, should go directly
    // into editing mode.
    if (!comment.contents) {
      this.startEditing();
    }
  }

  componentDidUpdate() {
    const { comment, focusedCommentId } = this.props;
    const notFocused = focusedCommentId !== comment.id;

    // We make sure that all unfocused comments are not in their editing state.
    // This way when a user focuses on a comment, the editor is not displayed.
    if (notFocused && this.state.editing) {
      this.stopEditing();
    }
  }

  startEditing = () => {
    this.setState({ editing: true });
  };

  stopEditing = () => {
    this.setState({ editing: false });
  };

  deleteComment = () => {
    const { removeComment, unfocusComment, comment } = this.props;
    unfocusComment();
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
        <div className="menu-item" onClick={this.deleteComment}>
          Delete Comment
        </div>
      </div>
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
              <CommentEditor comment={comment} stopEditing={this.stopEditing} location="timeline" />
            ) : (
              this.renderLabel()
            )}
          </div>
        </div>
      </div>
    );
  }

  render() {
    const {
      comment,
      zoomRegion,
      index,
      timelineDimensions,
      focusedCommentId,
      unfocusComment,
    } = this.props;
    const { description } = this.state;
    const commentWidth = 280;
    const shouldCollapse = focusedCommentId !== comment.id;

    if (shouldCollapse) {
      return <CommentMarker comment={comment} />;
    }

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

    return (
      <div>
        <CommentMarker comment={comment} />
        <div className="app-mask" onClick={unfocusComment} />
        <div
          className={classnames("comment")}
          style={{
            left: `${commentLeftOffset}%`,
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
    focusedCommentId: selectors.getFocusedCommentId(state),
  }),
  {
    removeComment: actions.removeComment,
    unfocusComment: actions.unfocusComment,
  }
)(Comment);
