import React, { useState } from "react";

import { connect } from "react-redux";
import classnames from "classnames";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { gql, useMutation } from "@apollo/client";

import CommentEditor from "ui/components/Comments/CommentEditor";
import Dropdown from "devtools/client/debugger/src/components/shared/Dropdown";

const DELETE_COMMENT = gql`
  mutation DeleteComment($commentId: uuid) {
    delete_comments(where: { id: { _eq: $commentId } }) {
      returning {
        id
      }
    }
  }
`;

function Comment({ comment, currentTime, seek }) {
  const [editing, setEditing] = useState(false);
  const [deleteComment] = useMutation(DELETE_COMMENT, {
    refetchQueries: ["GetComments"],
  });

  const removeComment = () => {
    deleteComment({ variables: { commentId: comment.id } });
  };
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
          panel={
            <CommentDropdownPanel
              comment={comment}
              removeComment={removeComment}
              startEditing={() => setEditing(true)}
            />
          }
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

function CommentDropdownPanel({ comment, removeComment, startEditing }) {
  return (
    <div className="dropdown-panel">
      <div className="menu-item" onClick={startEditing}>
        Edit Comment
      </div>
      <div className="menu-item" onClick={() => removeComment(comment)}>
        Delete Comment
      </div>
    </div>
  );
}

export default connect(state => ({ currentTime: selectors.getCurrentTime(state) }), {
  seek: actions.seek,
})(Comment);
