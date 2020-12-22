import React, { useState } from "react";
import { connect } from "react-redux";
import classnames from "classnames";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";

import Dropdown from "devtools/client/debugger/src/components/shared/Dropdown";
import CommentEditor from "ui/components/Comments/CommentEditor";
import CommentDropdownPanel from "ui/components/Comments/CommentDropdownPanel";

function CommentEntry({ comment, currentTime, seek }) {
  const [editing, setEditing] = useState(false);
  const seekToComment = () => {
    const { point, time, has_frames } = comment;

    if (editing) {
      return;
    }

    return seek(point, time, has_frames);
  };

  return (
    <div
      className={classnames("comment", { selected: currentTime === comment.time })}
      onClick={seekToComment}
      onDoubleClick={() => setEditing(true)}
    >
      <div className="img event-comment" />
      {editing ? (
        <CommentEditor comment={comment} stopEditing={() => setEditing(false)} />
      ) : (
        <CommentBody comment={comment} startEditing={() => setEditing(true)} />
      )}
      <div className="comment-dropdown" onClick={e => e.stopPropagation()}>
        <Dropdown
          panel={<CommentDropdownPanel comment={comment} startEditing={() => setEditing(true)} />}
          icon={<div>⋯</div>}
        />
      </div>
    </div>
  );
}

function CommentBody({ comment, startEditing }) {
  const lines = comment.content.split("\n");

  return (
    <div className="comment-body">
      <div className="item-label">Comment</div>
      <div className="item-content" onDoubleClick={startEditing}>
        {lines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  );
}

export default connect(state => ({ currentTime: selectors.getCurrentTime(state) }), {
  seek: actions.seek,
})(CommentEntry);
