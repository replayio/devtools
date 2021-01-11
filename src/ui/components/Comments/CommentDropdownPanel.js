import React from "react";
import hooks from "ui/hooks";

export default function CommentDropdownPanel({
  user,
  comment,
  allowReply,
  startEditing,
  startReplying,
  onItemClick,
}) {
  const deleteComment = hooks.useDeleteComment();
  const deleteCommentReplies = hooks.useDeleteCommentReplies();
  const isAuthor = comment.user_id === user?.id;

  const removeComment = () => {
    deleteComment({ variables: { commentId: comment.id } });

    if (!comment.parent_id) {
      deleteCommentReplies({ variables: { parentId: comment.id } });
    }
  };

  if (!user?.loggedIn) {
    return null;
  }

  return (
    <div className="dropdown-panel" onClick={onItemClick}>
      {isAuthor && (
        <div className="menu-item" onClick={startEditing}>
          Edit Comment
        </div>
      )}
      {user?.loggedIn && (
        <>
          <div className="menu-item" onClick={() => removeComment(comment)}>
            Delete Comment
          </div>
          {!comment.parent_id && allowReply && (
            <div className="menu-item" onClick={startReplying}>
              Reply to Comment
            </div>
          )}
        </>
      )}
    </div>
  );
}
