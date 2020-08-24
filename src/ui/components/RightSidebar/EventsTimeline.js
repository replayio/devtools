import React from "react";
import ReactDOM from "react-dom";

import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { sortBy } from "lodash";

import Comment from "ui/components/RightSidebar/Comment";

import "./EventsTimeline.css";

class EventsTimeline extends React.Component {
  state = {
    editing: false,
  };

  render() {
    const { comments, expanded } = this.props;

    if (!expanded) {
      return null;
    }

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
        {sortBy(comments, comment => comment.time).map(comment => (
          <Comment comment={comment} key={comment.id} />
        ))}
      </div>
    );
  }
}

export default connect(
  state => ({
    comments: selectors.getComments(state),
  }),
  {}
)(EventsTimeline);
