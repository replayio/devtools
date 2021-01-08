import React from "react";
import { connect } from "react-redux";
import classnames from "classnames";

import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import hooks from "ui/hooks";
import { getPixelOffset, getCommentLeftOffset } from "ui/utils/timeline";

import CommentMarker from "./CommentMarker";
import PortalDropdown from "ui/components/shared/PortalDropdown";
import CommentEditor from "./CommentEditor";
import CommentDropdownPanel from "./CommentDropdownPanel";

function Mask({ setFocusedCommentId, comment }) {
  const deleteComment = hooks.useDeleteComment();

  const onClick = () => {
    // If a comment doesn't have any content, it means it's a newly-added
    // comment. If the user clicks outside the comment editor, we should
    // just delete that comment.
    if (!comment.content) {
      deleteComment({ variables: { commentId: comment.id } });
    }
    setFocusedCommentId(null);
  };

  return <div className="app-mask" onClick={onClick} />;
}

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
    const { user, comment } = this.props;
    if (user?.loggedIn && comment.user_id == user?.id) {
      this.setState({ editing: true });
    }
  };

  stopEditing = () => {
    this.setState({ editing: false });
  };

  deleteComment = () => {
    const { setFocusedCommentId, comment } = this.props;
    setFocusedCommentId(null);
    removeComment(comment);
  };

  renderDropdownPanel() {
    const { comment, user } = this.props;
    return (
      <CommentDropdownPanel
        startEditing={this.startEditing}
        allowReply={false}
        user={user}
        comment={comment}
        onItemClick={() => this.setState({ editing: false })}
      />
    );
  }

  renderLabel() {
    const { comment } = this.props;
    const lines = comment.content.split("\n");

    return (
      <div className="label" onDoubleClick={this.startEditing}>
        {lines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    );
  }

  renderCommentBody() {
    const { editing, menuExpanded } = this.state;
    const { comment } = this.props;
    const isNewComment = comment.content === "";

    return (
      <div className="comment-body">
        <div className="comment-content">
          {!isNewComment ? (
            <div className="comment-header">
              <div className="actions">
                <PortalDropdown
                  buttonContent={<div className="dropdown-button">⋯</div>}
                  expanded={menuExpanded}
                  setExpanded={value => this.setState({ menuExpanded: value })}
                >
                  {this.renderDropdownPanel()}
                </PortalDropdown>
              </div>
            </div>
          ) : null}
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
    const {
      comment,
      zoomRegion,
      timelineDimensions,
      focusedCommentId,
      setFocusedCommentId,
    } = this.props;
    const { editing } = this.state;

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
        <Mask setFocusedCommentId={setFocusedCommentId} comment={comment} editing={editing} />
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
    user: selectors.getUser(state),
  }),
  {
    removeComment: actions.removeComment,
    setFocusedCommentId: actions.setFocusedCommentId,
  }
)(Comment);
