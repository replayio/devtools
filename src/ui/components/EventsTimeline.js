import React from "react";
import ReactDOM from "react-dom";

import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { sortBy } from "lodash";

import { ThreadFront } from "protocol/thread";

import "./EventsTimeline.css";

class EventsTimeline extends React.Component {
  threadFront = ThreadFront;
  state = { expanded: true };

  seekToMarker = (e, message) => {
    e.preventDefault();
    e.stopPropagation();
    const { point, time, hasFrames } = message;
    return this.threadFront.timeWarp(point, time, hasFrames);
  };

  toggleExpanded = () => {
    this.setState({ expanded: !this.state.expanded });
  };

  renderComment = comment => {
    // When a user adds a comment from the timeline, the comments array is updated
    // immediately with a new comment with empty content. We don't want to display
    // that empty comment until the user has submitted its content.
    if (!comment.contents) {
      return null;
    }

    return (
      <div className="event" key={comment.id} onClick={e => this.seekToMarker(e, comment)}>
        <div className="img comment"></div>
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
    // timelineDimensions: selectors.getTimelineDimensions(state),
    // zoomRegion: selectors.getZoomRegion(state),
    comments: selectors.getComments(state),
  }),
  {
    // showComment: actions.showComment,
    // updateComment: actions.updateComment,
    // removeComment: actions.removeComment,
    // createComment: actions.createComment,
  }
)(EventsTimeline);
