import React, { useEffect, useState, useRef } from "react";
import hooks from "ui/hooks";
import { connect } from "react-redux";
import classnames from "classnames";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import PortalDropdown from "ui/components/shared/PortalDropdown";

import { useAuth0 } from "@auth0/auth0-react";
import moment from "moment";

import CommentEditor from "ui/components/Comments/CommentEditor";
import "./CommentThread.css";

function CommentThread({
  comment,
  pendingComment,
  currentTime,
  seek,
  hoveredComment,
  setHoveredComment,
  setActiveComment,
  clearPendingComment,
  setPendingComment,
  activeComment,
}) {
  const { isAuthenticated } = useAuth0();
  const commentEl = useRef(null);
  const seekToComment = e => {
    const { point, time, has_frames } = comment;
    e.stopPropagation();
    clearPendingComment();
    setActiveComment(comment);

    return seek(point, time, has_frames);
  };

  useEffect(() => {
    if (comment.time === currentTime) {
      commentEl.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentTime, pendingComment]);

  const isPending = comment.content == "";
  const isEditing = pendingComment && pendingComment.id;
  const isSelected = (activeComment === comment && !isEditing) || isPending;

  return (
    <div
      className={classnames("comment-container", {
        selected: isSelected,
        pending: isPending,
      })}
      ref={commentEl}
    >
      {
        <div
          className="comment"
          onClick={seekToComment}
          onMouseEnter={() => setHoveredComment(comment.id)}
          onMouseLeave={() => setHoveredComment(null)}
        >
          <div className="comment-body">
            {!isPending && (
              <Comment {...{ comment, hoveredComment, pendingComment, setPendingComment }} isRoot />
            )}
            {comment.replies?.map((reply, i) => (
              <Comment
                comment={reply}
                key={i}
                pendingComment={pendingComment}
                placeholder={reply.content}
                setPendingComment={setPendingComment}
              />
            ))}
            {isAuthenticated && isSelected && (
              <CommentEditor comment={comment} placeholder={"Type a comment ..."} />
            )}
          </div>
        </div>
      }
    </div>
  );
}

function Comment({ comment, isRoot, hoveredComment, pendingComment, setPendingComment }) {
  const lines = comment.content.split("\n");
  const isBeingEdited = comment === pendingComment && comment.content !== "";

  if (isBeingEdited) {
    return <CommentEditor comment={comment} placeholder={comment.content} editing />;
  }

  return (
    <div className="comment-body-item">
      <div className="comment-body-header">
        <img src={comment.user.picture} className="comment-picture" />
        <div className="comment-body-header-label">
          <div className="comment-body-header-label-name">{comment.user.name}</div>
        </div>
        <Actions {...{ comment, hoveredComment, setPendingComment, isRoot }} />
      </div>
      <div className="item-content">
        {lines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  );
}

function Actions({ comment, hoveredComment, setPendingComment, isRoot }) {
  const { user } = useAuth0();
  const deleteComment = hooks.useDeleteComment();
  const deleteCommentReplies = hooks.useDeleteCommentReplies();
  const [expanded, setExpanded] = useState(false);

  const isHovered = hoveredComment == comment.id;
  const isCommentAuthor = user?.sub === comment.user.auth_id;

  if (!isCommentAuthor) {
    return null;
  }

  const handleDelete = () => {
    deleteComment({ variables: { commentId: comment.id } });

    if (isRoot) {
      deleteCommentReplies({ variables: { parentId: comment.id } });
    }
  };
  const editComment = () => {
    setPendingComment(comment);
  };

  return (
    <div className="comment-actions" onClick={e => e.stopPropagation()}>
      <PortalDropdown
        buttonContent={<div className="dropdown-button">⋮</div>}
        setExpanded={setExpanded}
        expanded={expanded}
        buttonStyle=""
        position="bottom-right"
      >
        <div className="comments-dropdown-item" title="Delete Comment" onClick={editComment}>
          Edit comment
        </div>
        <div className="comments-dropdown-item" title="Delete Comment" onClick={handleDelete}>
          {isRoot ? "Delete comment and replies" : "Delete comment"}
        </div>
      </PortalDropdown>
    </div>
  );
}

export default connect(
  state => ({
    pendingComment: selectors.getPendingComment(state),
    currentTime: selectors.getCurrentTime(state),
    hoveredComment: selectors.getHoveredComment(state),
    activeComment: selectors.getActiveComment(state),
  }),
  {
    seek: actions.seek,
    setHoveredComment: actions.setHoveredComment,
    setActiveComment: actions.setActiveComment,
    clearPendingComment: actions.clearPendingComment,
    setPendingComment: actions.setPendingComment,
  }
)(CommentThread);
