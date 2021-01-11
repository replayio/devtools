import React, { useEffect, useState, useRef } from "react";
import { connect } from "react-redux";
import classnames from "classnames";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";

import CommentEditor from "ui/components/Comments/CommentEditor";
import CommentDropdownPanel from "ui/components/Comments/CommentDropdownPanel";
import PortalDropdown from "ui/components/shared/PortalDropdown";

function CommentEntry({ comment, user, currentTime, seek }) {
  const [editing, setEditing] = useState(false);
  const [replying, setReplying] = useState(false);
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
    // A newly-added comment, which is initialized as empty, should go directly
    // into editing mode.
    if (!comment.content) {
      setEditing(true);
    }
  }, [comment]);

  useEffect(() => {
    if (comment.time === currentTime) {
      console.log(commentEl);
      commentEl.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentTime]);

  return (
    <div className="comment-container" ref={commentEl}>
      <div
        className={classnames(
          "comment",
          { selected: currentTime === comment.time },
          { reply: replying },
          { "child-comment": comment.parent_id }
        )}
        onClick={seekToComment}
      >
        <img src={comment.user.picture} className="comment-picture" />
        {editing ? (
          <CommentEditor replying={false} comment={comment} stopEditing={() => setEditing(false)} />
        ) : (
          <CommentBody comment={comment} user={user} startEditing={() => setEditing(true)} />
        )}
        <div className="comment-dropdown" onClick={e => e.stopPropagation()}>
          <PortalDropdown
            buttonContent={<div className="dropdown-button">⋯</div>}
            expanded={menuExpanded}
            setExpanded={setMenuExpanded}
          >
            <CommentDropdownPanel
              user={user}
              comment={comment}
              allowReply={true}
              startEditing={() => setEditing(true)}
              startReplying={() => setReplying(true)}
              onItemClick={() => setMenuExpanded(false)}
            />
          </PortalDropdown>
        </div>
      </div>
      {replying && (
        <div className="comment">
          <CommentEditor
            replying={true}
            comment={comment}
            stopReplying={() => setReplying(false)}
          />
        </div>
      )}
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
)(CommentEntry);
