import React from "react";

import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { sortBy } from "lodash";

import Comment from "ui/components/SecondaryToolbox/Comment";

import "./CommentsPanel.css";

class CommentsPanel extends React.Component {
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
    const { comments } = this.props;

    if (!comments.length) {
      return (
        <div className="comments-panel">
          <p>There is nothing here yet. Try adding a comment in the timeline below.</p>
          {this.renderAddCommentButton()}
        </div>
      );
    }

    return (
      <div className="comments-panel">
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
)(CommentsPanel);
