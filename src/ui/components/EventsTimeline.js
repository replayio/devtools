import React from "react";
import ReactDOM from "react-dom";

import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { sortBy } from "lodash";

import "./EventsTimeline.css";

const avatarColors = ["#2D4551", "#509A8F", "#E4C478", "#E9A56C", "#D97559"];

class EventsTimeline extends React.Component {
  state = { expanded: true };

  seekToComment = comment => {
    const { point, time, hasFrames } = comment;
    return this.props.seek(point, time, hasFrames);
  };

  toggleExpanded = () => {
    this.setState({ expanded: !this.state.expanded });
  };

  getAvatarColor(avatarID) {
    return avatarColors[avatarID % avatarColors.length];
  }

  renderAvatar(user) {
    // Comments that have been made prior to adding the users feature don't
    // have an associated user. We just give those comments a grey circle.
    // This should be removed eventually.
    let color = user ? this.getAvatarColor(user.avatarID) : "#696969";

    return <div className="avatar" style={{ background: color }}></div>;
  }

  renderComment = comment => {
    // When a user adds a comment from the timeline, the comments array is updated
    // immediately with a new comment with empty content. We don't want to display
    // that empty comment until the user has submitted its content.
    if (!comment.contents) {
      return null;
    }

    return (
      <div className="event" key={comment.id} onClick={e => this.seekToComment(comment)}>
        {this.renderAvatar(comment.user)}
        <div className="label">{comment.contents}</div>
      </div>
    );
  };

  renderComments() {
    const { comments } = this.props;

    // This shows an empty state for when there are no comments yet. It also
    // prevents an empty comment from displayed when the user is still filling
    // in the content with the textbox.
    if (!comments.length || comments[0].content) {
      return (
        <div className="events-timeline-comments">
          <p>There is nothing here yet. Try adding a comment in the timeline below.</p>
        </div>
      );
    }

    return (
      <div className="events-timeline-comments">
        {sortBy(comments, comment => comment.time).map(this.renderComment)}
      </div>
    );
  }

  renderRightSidebar() {
    return (
      <div className="right-sidebar">
        <button className="comment-button-container" onClick={this.toggleExpanded}>
          <div className="img comment-icon"></div>
        </button>
      </div>
    );
  }

  render() {
    const { comments } = this.props;
    const { expanded } = this.state;

    return (
      <div className={expanded ? "events-timeline expanded" : "events-timeline collapsed"}>
        {this.renderComments()}
        {this.renderRightSidebar()}
      </div>
    );
  }
}

export default connect(
  state => ({
    comments: selectors.getComments(state),
  }),
  { seek: actions.seek }
)(EventsTimeline);
