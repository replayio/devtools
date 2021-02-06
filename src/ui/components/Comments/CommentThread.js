import React, { useEffect, useState, useRef } from "react";
import hooks from "ui/hooks";
import { connect } from "react-redux";
import classnames from "classnames";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { useAuth0 } from "@auth0/auth0-react";
import moment from "moment";

import CommentEditor from "ui/components/Comments/CommentEditor";

function CommentThread({
  comment,
  pendingComment,
  currentTime,
  seek,
  hoveredComment,
  setHoveredComment,
  clearPendingComment,
}) {
  const commentEl = useRef(null);
  const { isAuthenticated } = useAuth0();
  const seekToComment = () => {
    const { point, time, has_frames } = comment;
    clearPendingComment();

    return seek(point, time, has_frames);
  };

  useEffect(() => {
    if (comment.time === currentTime || pendingComment?.id == comment.id) {
      commentEl.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentTime, pendingComment]);

  const isEditing = pendingComment?.id == comment.id || comment.content == "";
  const isPending = !comment.user;

  return (
    <div
      className={classnames("comment-container", {
        selected: currentTime === comment.time,
      })}
      ref={commentEl}
    >
      {!isPending && (
        <div
          className={classnames("comment", {
            selected: currentTime === comment.time,
            highlighted: comment.id === hoveredComment || isEditing,
            "child-comment": comment.parent_id,
          })}
          onClick={seekToComment}
          onMouseEnter={() => setHoveredComment(comment.id)}
          onMouseLeave={() => setHoveredComment(null)}
        >
          <CommentBody comment={comment} hoveredComment={hoveredComment} />
        </div>
      )}
      {comment.time == currentTime && isAuthenticated && <CommentEditor comment={comment} />}
    </div>
  );
}

function CommentBody({ comment, hoveredComment }) {
  return (
    <div className="comment-body">
      <CommentBodyItem comment={comment} hoveredComment={hoveredComment} isRoot />
      {comment.replies.map((reply, i) => (
        <CommentBodyItem comment={reply} key={i} />
      ))}
    </div>
  );
}

function CommentBodyItem({ comment, isRoot, hoveredComment }) {
  const lines = comment.content.split("\n");
  const rel = moment(comment.created_at).fromNow();

  return (
    <div className="comment-body-item">
      <div className="comment-body-header">
        <img src={comment.user.picture} className="comment-picture" />
        <div className="comment-body-header-label">
          <div className="comment-body-header-label-name">{comment.user.name}</div>
          <div className="comment-body-header-label-date">{rel}</div>
        </div>
        {isRoot && <TimestampOrAction {...{ comment, hoveredComment }} />}
      </div>
      <div className="item-content">
        {lines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  );
}

function TimestampOrAction({ comment, hoveredComment }) {
  const { user } = useAuth0();
  const isHovered = hoveredComment == comment.id;
  const deleteComment = hooks.useDeleteComment();
  const deleteCommentReplies = hooks.useDeleteCommentReplies();
  const isThreadAuthor = user?.sub === comment.user.auth_id;

  const deleteThread = e => {
    e.stopPropagation();
    deleteComment({ variables: { commentId: comment.id } });
    deleteCommentReplies({ variables: { parentId: comment.id } });
  };

  if (isHovered && isThreadAuthor) {
    return (
      <div className="comment-actions">
        <button className="img trash" title="Delete Thread" onClick={deleteThread} />
      </div>
    );
  }

  return (
    <div className="comment-body-header-timestamp">{`00:${Math.floor(comment.time / 1000)
      .toString()
      .padStart(2, 0)}`}</div>
  );
}

export default connect(
  state => ({
    pendingComment: selectors.getPendingComment(state),
    currentTime: selectors.getCurrentTime(state),
    hoveredComment: selectors.getHoveredComment(state),
  }),
  {
    seek: actions.seek,
    setHoveredComment: actions.setHoveredComment,
    clearPendingComment: actions.clearPendingComment,
  }
)(CommentThread);
