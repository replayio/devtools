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
    addingComment: false,
  };

  toggleAddingCommentOff = () => {
    this.setState({ addingComment: false });
  };

  toggleAddingCommentOn = () => {
    this.setState({ addingComment: true });
  };

  renderAddCommentButton() {
    const { createComment } = this.props;
    const { addingComment } = this.state;

    if (addingComment) {
      return null;
    }

    return (
      <button className="add-comment" onClick={() => createComment(null, false, "eventsTimeline")}>
        Add a comment
      </button>
    );
  }

  render() {
    const { comments, expanded } = this.props;

    if (!expanded) {
      return null;
    }

    if (!comments.length) {
      return (
        <div className="events-timeline-comments">
          <p>There is nothing here yet. Try adding a comment in the timeline below.</p>
          {this.renderAddCommentButton()}
        </div>
      );
    }

    return (
      <div className="events-timeline-comments">
        {sortBy(comments, comment => comment.time).map(comment => (
          <Comment
            comment={comment}
            key={comment.id}
            toggleAddingCommentOff={this.toggleAddingCommentOff}
            toggleAddingCommentOn={this.toggleAddingCommentOn}
          />
        ))}
        {this.renderAddCommentButton()}
      </div>
    );
  }
}

export default connect(
  state => ({
    comments: selectors.getComments(state),
  }),
  { createComment: actions.createComment }
)(EventsTimeline);
