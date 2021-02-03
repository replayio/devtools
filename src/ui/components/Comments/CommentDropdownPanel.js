import React from "react";
import hooks from "ui/hooks";
import { connect } from "react-redux";
import { actions } from "ui/actions";
import { selectors } from "ui/reducers";
import { ThreadFront } from "protocol/thread";
import { useAuth0 } from "@auth0/auth0-react";

function CommentDropdownPanel({ comment, onItemClick, setPendingComment, recordingId, canvas }) {
  const { user } = useAuth0();
  const deleteComment = hooks.useDeleteComment();
  const deleteCommentReplies = hooks.useDeleteCommentReplies();
  const isAuthor = comment.user.auth_id == user.sub;

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
  const onEditClick = () => {
    const pendingComment = {
      id: comment.id,
      content: comment.content,
      recording_id: comment.recordingId,
      content: comment.content,
      time: comment.time,
      point: comment.point,
      has_frames: comment.has_frames,
      user: comment.user,
      position: comment.position,
    };

    if (comment.parent_id) {
      pendingComment.parent_id = comment.parent_id;
    }

    setPendingComment(pendingComment);
  };

  return (
    <div className="dropdown-panel" onClick={onItemClick}>
      {isAuthor && (
        <>
          <div className="menu-item" onClick={onEditClick}>
            Edit Comment
          </div>
          <div className="menu-item" onClick={() => removeComment(comment)}>
            Delete Comment
          </div>
        </>
      )}
      {!comment.parent_id && (
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
    canvas: selectors.getCanvas(state),
  }),
  {
    setPendingComment: actions.setPendingComment,
  }
)(CommentDropdownPanel);
