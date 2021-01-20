import React, { useEffect, useState, useRef } from "react";
import { connect } from "react-redux";
import classnames from "classnames";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { useAuth0 } from "@auth0/auth0-react";

import CommentEditor from "ui/components/Comments/CommentEditor";
import CommentDropdownPanel from "ui/components/Comments/CommentDropdownPanel";
import PortalDropdown from "ui/components/shared/PortalDropdown";

function Comment({ comment, user, currentTime, seek }) {
  const [editing, setEditing] = useState(false);
  const commentEl = useRef(null);
  const [menuExpanded, setMenuExpanded] = useState(false);
  const seekToComment = () => {
    const { point, time, has_frames } = comment;

    if (editing) {
      return;
    }

    return seek(point, time, has_frames);
  };

  useEffect(() => {
    if (comment.time === currentTime) {
      commentEl.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentTime]);

  if (comment.content === "") {
    return (
      <NewComment
        comment={comment}
        commentEl={commentEl}
        setEditing={setEditing}
        currentTime={currentTime}
      />
    );
  }

  return (
    <div className="comment-container" ref={commentEl}>
      <div
        className={classnames(
          "comment",
          { selected: currentTime === comment.time },
          { "child-comment": comment.parent_id }
        )}
        onClick={seekToComment}
      >
        <img src={comment.user.picture} className="comment-picture" />
        {editing ? (
          <CommentEditor comment={comment} stopEditing={() => setEditing(false)} />
        ) : (
          <CommentBody comment={comment} user={user} startEditing={() => setEditing(true)} />
        )}
        {!editing && user?.loggedIn ? (
          <div className="comment-dropdown" onClick={e => e.stopPropagation()}>
            <PortalDropdown
              buttonContent={<div className="dropdown-button">⋯</div>}
              expanded={menuExpanded}
              setExpanded={setMenuExpanded}
            >
              <CommentDropdownPanel
                user={user}
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

function NewComment({ comment, currentTime, commentEl, setEditing }) {
  const { user } = useAuth0();

  return (
    <div className="comment-container" ref={commentEl}>
      <div className={classnames("comment", { selected: currentTime === comment.time })}>
        <img src={user.picture} className="comment-picture" />
        <CommentEditor comment={comment} stopEditing={() => setEditing(false)} />
      </div>
    </div>
  );
}

function CommentBody({ comment, user, startEditing }) {
  const lines = comment.content.split("\n");

  const onDoubleClick = () => {
    if (user?.loggedIn && comment.user_id == user?.id) {
      startEditing();
    }
  };

  return (
    <div className="comment-body">
      <div className="item-label">{comment.user.name}</div>
      <div className="item-content" onDoubleClick={onDoubleClick}>
        {lines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  );
}

export default connect(
  state => ({
    currentTime: selectors.getCurrentTime(state),
    user: selectors.getUser(state),
  }),
  {
    seek: actions.seek,
  }
)(Comment);
