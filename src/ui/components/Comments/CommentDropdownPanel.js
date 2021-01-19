import React from "react";
import hooks from "ui/hooks";
import { connect } from "react-redux";
import { actions } from "ui/actions";
import { selectors } from "ui/reducers";
import { ThreadFront } from "protocol/thread";

function CommentDropdownPanel({
  user,
  comment,
  startEditing,
  onItemClick,
  setPendingComment,
  recordingId,
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
  const addReply = () => {
    const pendingComment = {
      content: "",
      recording_id: recordingId,
      time: comment.time,
      point: ThreadFront.currentPoint,
      has_frames: ThreadFront.currentPointHasFrames,
      parent_id: comment.id,
    };

    setPendingComment(pendingComment);
  };

  return (
    <div className="dropdown-panel" onClick={onItemClick}>
      {isAuthor && (
        <>
          <div className="menu-item" onClick={startEditing}>
            Edit Comment
          </div>
          <div className="menu-item" onClick={() => removeComment(comment)}>
            Delete Comment
          </div>
        </>
      )}
      {user?.loggedIn && !comment.parent_id && (
        <div className="menu-item" onClick={addReply}>
          Reply to Comment
        </div>
      )}
    </div>
  );
}

export default connect(
  state => ({
    recordingId: selectors.getRecordingId(state),
  }),
  {
    setPendingComment: actions.setPendingComment,
  }
)(CommentDropdownPanel);
