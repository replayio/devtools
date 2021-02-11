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
  const { isAuthenticated } = useAuth0();
  const seekToComment = () => {
    const { point, time, has_frames } = comment;
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
  const isSelected = activeComment === comment || isPending;

  return (
    <div
      className={classnames("comment-container", {
        selected: isSelected,
        pending: isPending,
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
  const { user } = useAuth0();
  const deleteComment = hooks.useDeleteComment();
  const deleteCommentReplies = hooks.useDeleteCommentReplies();
  const [expanded, setExpanded] = useState(false);

  const isHovered = hoveredComment == comment.id;
  const isThreadAuthor = user?.sub === comment.user.auth_id;

  const deleteThread = e => {
    e.stopPropagation();
    deleteComment({ variables: { commentId: comment.id } });
    deleteCommentReplies({ variables: { parentId: comment.id } });
  };

  if (!isHovered || !isThreadAuthor) {
    return null;
  }

  return (
    <div className="comment-actions">
      <PortalDropdown
        buttonContent={<div className="dropdown-button">⋮</div>}
        setExpanded={setExpanded}
        expanded={expanded}
        buttonStyle=""
        position="bottom-right"
      >
        <div className="comments-dropdown-item" title="Delete Comment" onClick={deleteThread}>
          Delete Comment
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
  }
)(CommentThread);
