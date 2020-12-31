import React from "react";
import { connect } from "react-redux";
import { actions } from "ui/actions";
import hooks from "ui/hooks";

export function CommentDropdownPanel({ user, comment, startEditing, setFocusedCommentId }) {
  const deleteComment = hooks.useDeleteComment();
  const isAuthor = comment.user_id === user?.id;

  const removeComment = () => {
    deleteComment({ variables: { commentId: comment.id } });
    setFocusedCommentId(null);
  };

  if (!user?.loggedIn) {
    return null;
  }

  return (
    <div className="dropdown-panel">
      {isAuthor && (
        <div className="menu-item" onClick={startEditing}>
          Edit Comment
        </div>
      )}
      {user?.loggedIn && (
        <div className="menu-item" onClick={() => removeComment(comment)}>
          Delete Comment
        </div>
      )}
    </div>
  );
}

export default connect(null, {
  setFocusedCommentId: actions.setFocusedCommentId,
})(CommentDropdownPanel);
