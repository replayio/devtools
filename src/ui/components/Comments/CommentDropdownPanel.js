import React from "react";
import { connect } from "react-redux";
import { actions } from "ui/actions";
import hooks from "ui/hooks";

export function CommentDropdownPanel({ comment, startEditing, setFocusedCommentId }) {
  const deleteComment = hooks.useDeleteComment();

  const removeComment = () => {
    deleteComment({ variables: { commentId: comment.id } });
    setFocusedCommentId(null);
  };

  return (
    <div className="dropdown-panel">
      <div className="menu-item" onClick={startEditing}>
        Edit Comment
      </div>
      <div className="menu-item" onClick={() => removeComment(comment)}>
        Delete Comment
      </div>
    </div>
  );
}

export default connect(null, {
  setFocusedCommentId: actions.setFocusedCommentId,
})(CommentDropdownPanel);
