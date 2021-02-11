import React, { useEffect, useState, useRef } from "react";
import hooks from "ui/hooks";
import { connect } from "react-redux";
import classnames from "classnames";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import PortalDropdown from "ui/components/shared/PortalDropdown";

import moment from "moment";

import CommentEditor from "ui/components/Comments/CommentEditor";
import useAuth from "ui/utils/auth/useAuth";

function CommentThread({
  comment,
  pendingComment,
  currentTime,
  seek,
  hoveredComment,
  setHoveredComment,
  setActiveComment,
  activeComment,
  clearPendingComment,
}) {
  const commentEl = useRef(null);
  const { isAuthenticated } = useAuth();
  const seekToComment = () => {
    const { point, time, has_frames } = comment;
    clearPendingComment();
    setActiveComment(comment);

    return seek(point, time, has_frames);
  };

  useEffect(() => {
    if (comment.time === currentTime || pendingComment?.id == comment.id) {
      commentEl.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentTime, pendingComment]);

  const isPending = comment.content == "";
  const isSelected = activeComment === comment || isPending;

  return (
    <div
      className={classnames("comment-container", {
        selected: isSelected,
      })}
      ref={commentEl}
    >
      {!isPending && (
        <div
          className="comment"
          onClick={seekToComment}
          onMouseEnter={() => setHoveredComment(comment.id)}
          onMouseLeave={() => setHoveredComment(null)}
        >
          <CommentBody comment={comment} hoveredComment={hoveredComment} />
        </div>
      )}
      {isSelected && isAuthenticated && <CommentEditor comment={comment} />}
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
          {/* <div className="comment-body-header-label-date">{rel}</div> */}
        </div>
        {isRoot && <Actions {...{ comment, hoveredComment }} />}
      </div>
      <div className="item-content">
        {lines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  );
}

function Actions({ comment, hoveredComment }) {
  const { user } = useAuth();
  const deleteComment = hooks.useDeleteComment();
  const deleteCommentReplies = hooks.useDeleteCommentReplies();
  const [expanded, setExpanded] = useState(false);

  const isHovered = hoveredComment == comment.id;
  const isThreadAuthor = user?.id === comment.user.auth_id;

  const deleteThread = e => {
    e.stopPropagation();
    deleteComment({ variables: { commentId: comment.id } });
    deleteCommentReplies({ variables: { parentId: comment.id } });
  };

  if (isHovered && isThreadAuthor) {
    return (
      <div className="comment-actions">
        <PortalDropdown
          buttonContent={<div className="dropdown-button">⋮</div>}
          setExpanded={setExpanded}
          expanded={expanded}
          buttonStyle=""
          position="bottom-right"
        >
          {/* <div className="comments-dropdown-item" title="Edit Comment" onClick={deleteThread}>
            Edit comment
          </div> */}
          <div className="comments-dropdown-item" title="Delete Comment" onClick={deleteThread}>
            Delete Comment
          </div>
        </PortalDropdown>
      </div>
    );
  }

  return <Timestamp comment={comment} />;
}

function Timestamp({ comment }) {
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
    activeComment: selectors.getActiveComment(state),
  }),
  {
    seek: actions.seek,
    setHoveredComment: actions.setHoveredComment,
    setActiveComment: actions.setActiveComment,
    clearPendingComment: actions.clearPendingComment,
  }
)(CommentThread);
