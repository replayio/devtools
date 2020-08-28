import React from "react";

import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { getAvatarColor } from "ui/utils/user";
import classnames from "classnames";
import CommentEditor from "ui/components/Comments/CommentEditor";

import Dropdown from "devtools/client/debugger/src/components/shared/Dropdown";

class Comment extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      editing: false,
    };
  }

  componentDidMount() {
    const { contents, addedFrom } = this.props.comment;
    const { editing } = this.state;

    // A newly-added (empty) comment from the Events Timeline "Add a Comment" button
    // should directly go into editing mode.
    if (!contents && addedFrom == "eventsTimeline") {
      this.startEditing();
    }
  }

  startEditing = () => {
    this.setState({ editing: true });
    this.props.toggleAddingCommentOn();
  };

  stopEditing = () => {
    this.setState({ editing: false });
    this.props.toggleAddingCommentOff();
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
    if (!comment.user) {
      return <div className="comment-avatar" style={{ background: getAvatarColor(null) }}></div>;
    }

    const { picture, name, avatarID } = comment.user;

    return (
      <div className="comment-avatar" style={{ background: getAvatarColor(avatarID) }}>
        {picture && <img src={picture} alt={name} />}
      </div>
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

  renderBody() {
    return (
      <div className="comment-body">
        {this.state.editing ? (
          <CommentEditor comment={this.props.comment} stopEditing={this.stopEditing} />
        ) : (
          this.renderLabel()
        )}
      </div>
    );
  }

  render() {
    const { comment, id, currentTime } = this.props;
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
  removeComment: actions.removeComment,
})(Comment);
