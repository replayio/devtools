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
    editingComment: false,
  };

  toggleEditingCommentOn = () => {
    this.setState({ editingComment: true });
  };

  toggleEditingCommentOff = () => {
    this.setState({ editingComment: false });
  };

  renderAddCommentButton() {
    const { createComment, focusedCommentId } = this.props;
    const { editingComment } = this.state;

    if (focusedCommentId || editingComment) {
      return null;
    }

    return (
      <button className="add-comment" onClick={() => createComment()}>
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
            toggleEditingCommentOff={this.toggleEditingCommentOff}
            toggleEditingCommentOn={this.toggleEditingCommentOn}
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
    focusedCommentId: selectors.getFocusedCommentId(state),
  }),
  { createComment: actions.createComment }
)(EventsTimeline);
