import React from "react";

import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { getAvatarColor } from "ui/utils/user";
import classnames from "classnames";

import Dropdown from "devtools/client/debugger/src/components/shared/Dropdown";

class Comment extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      inputValue: props.comment.contents,
      editing: false,
    };
  }

  startEditing = () => {
    this.setState({ editing: true });
  };

  stopEditing = () => {
    this.setState({ editing: false });
  };

  onChange = e => {
    this.setState({ inputValue: e.target.value });
  };

  onKeyDown = e => {
    if (e.key == "Escape") {
      this.stopEditingComment();
    } else if (e.key == "Enter") {
      this.saveEditedComment(e);
    }
  };

  saveEditedComment = e => {
    const { comment } = this.props;
    const { inputValue } = this.state;

    e.stopPropagation();
    this.stopEditing();
    this.props.updateComment({ ...comment, contents: inputValue });
  };

  stopEditingComment = e => {
    const { comment } = this.props;

    this.setState({ inputValue: comment.contents });
    e.stopPropagation();
    this.stopEditing();
  };

  seekToComment = comment => {
    const { point, time, hasFrames } = this.props.comment;
    if (this.state.editing) {
      return null;
    }

    return this.props.seek(point, time, hasFrames);
  };

  renderDropdownPanel() {
    const { removeComment, comment } = this.props;

    return (
      <div className="dropdown-panel">
        <div className="menu-item" onClick={this.startEditing}>
          Edit Comment
        </div>
        <div className="menu-item" onClick={() => removeComment(comment)}>
          Delete Comment
        </div>
      </div>
    );
  }

  renderAvatar() {
    const { comment } = this.props;

    // Comments that have been made prior to adding the users feature don't
    // have an associated user. We just give those comments a grey circle.
    // This should be removed eventually.

    return (
      <div
        className="comment-avatar"
        style={{ background: getAvatarColor(comment?.user.avatarID) }}
      ></div>
    );
  }

  renderLabel() {
    const { comment } = this.props;

    return (
      <div className="label" onDoubleClick={this.startEditing}>
        {comment.contents}
      </div>
    );
  }

  renderButtons() {
    return (
      <div className="buttons">
        <button className="cancel" onClick={this.stopEditingComment}>
          Cancel
        </button>
        <button className="save" onClick={this.saveEditedComment}>
          Save
        </button>
      </div>
    );
  }

  renderCommentEditor() {
    const { comment } = this.props;

    return (
      <div className="editor">
        <textarea
          defaultValue={comment.contents}
          onChange={this.onChange}
          onKeyDown={this.onKeyDown}
        />
        {this.renderButtons()}
      </div>
    );
  }

  renderBody() {
    const { editing } = this.state;

    return (
      <div className="comment-body">
        {editing ? this.renderCommentEditor() : this.renderLabel()}
      </div>
    );
  }

  render() {
    const { comment, id, currentTime } = this.props;

    // When a user adds a comment from the timeline, the comments array is updated
    // immediately with a new comment with empty content. We don't want to display
    // that empty comment until the user has submitted its content.
    if (!comment.contents) {
      return null;
    }

    const selected = currentTime === comment.time;

    return (
      <div
        className={classnames("comment", { selected })}
        onClick={this.seekToComment}
        onDoubleClick={this.startEditing}
      >
        {this.renderAvatar()}
        {this.renderBody()}
        <div onClick={e => e.stopPropagation()}>
          <Dropdown panel={this.renderDropdownPanel()} icon={<div>⋯</div>} />
        </div>
      </div>
    );
  }
}

export default connect(state => ({ currentTime: selectors.getCurrentTime(state) }), {
  seek: actions.seek,
  updateComment: actions.updateComment,
  removeComment: actions.removeComment,
})(Comment);
