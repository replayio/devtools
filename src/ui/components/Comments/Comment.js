import React, { useEffect, useState, useRef } from "react";
import { connect } from "react-redux";
import classnames from "classnames";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { useAuth0 } from "@auth0/auth0-react";

import CommentEditor from "ui/components/Comments/CommentEditor";
import CommentDropdownPanel from "ui/components/Comments/CommentDropdownPanel";
import PortalDropdown from "ui/components/shared/PortalDropdown";

function getShowDropdown(comment, editing) {
  const { isAuthenticated, user } = useAuth0();
  const {
    parent_id,
    user: { auth_id },
  } = comment;

  if (editing || !isAuthenticated) {
    return false;
  }

  // Don't show the dropdown for replies that don't belong
  // to the user, since there's no action for them to do then.
  if (parent_id && auth_id != user.sub) {
    return false;
  }

  return true;
}

function Comment({
  comment,
  pendingComment,
  currentTime,
  seek,
  hoveredComment,
  setHoveredComment,
  clearPendingComment,
}) {
  const commentEl = useRef(null);
  const [menuExpanded, setMenuExpanded] = useState(false);
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

  if (comment.content === "") {
    return <NewComment comment={comment} commentEl={commentEl} currentTime={currentTime} />;
  }

  const isEditing = pendingComment?.id == comment.id || comment.content == "";
  const showDropdown = getShowDropdown(comment, isEditing);

  return (
    <div className="comment-container" ref={commentEl}>
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
        <img src={comment.user.picture} className="comment-picture" />
        {isEditing ? <CommentEditor comment={comment} /> : <CommentBody comment={comment} />}
        {showDropdown ? (
          <div className="comment-dropdown" onClick={e => e.stopPropagation()}>
            <PortalDropdown
              buttonContent={<div className="dropdown-button">⋯</div>}
              expanded={menuExpanded}
              setExpanded={setMenuExpanded}
            >
              <CommentDropdownPanel
                comment={comment}
                startEditing={() => setEditing(true)}
                onItemClick={() => setMenuExpanded(false)}
              />
            </PortalDropdown>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function NewComment({ comment, currentTime, commentEl }) {
  const { user } = useAuth0();

  return (
    <div className="comment-container" ref={commentEl}>
      <div className={classnames("comment", { selected: currentTime === comment.time })}>
        <img src={user.picture} className="comment-picture" />
        <CommentEditor comment={comment} />
      </div>
    </div>
  );
}

function CommentBody({ comment }) {
  const lines = comment.content.split("\n");
  const { isAuthenticated, user } = useAuth0();

  return (
    <div className="comment-body">
      <div className="item-label">{comment.user.name}</div>
      <div className="item-content">
        {lines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
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
)(Comment);
