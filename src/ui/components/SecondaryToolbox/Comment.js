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
    this.props.toggleEditingCommentOn();
  };

  stopEditing = () => {
    this.setState({ editing: false });
    this.props.toggleEditingCommentOff();
  };

  seekToComment = e => {
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

  renderNewComment() {
    const { comment } = this.props;
    const lines = comment.contents.split("\n");

    return (
      <div className="comment-body">
        <div className="item-label">Comment</div>
        <div className="item-content" onDoubleClick={this.startEditing}>
          {lines.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
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
        <div className="img event-comment" />
        {this.renderNewComment()}
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
