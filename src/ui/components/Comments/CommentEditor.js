import React, { useState, useRef, useEffect } from "react";

import { connect } from "react-redux";
import { actions } from "ui/actions";
import hooks from "ui/hooks";

function CommentEditor({ comment, stopEditing, setFocusedCommentId, stopReplying, replying }) {
  const [inputValue, setInputValue] = useState(replying ? null : comment.content);
  const textareaNode = useRef(null);

  const closeEditor = () => {
    if (replying) {
      stopReplying();
    } else {
      stopEditing();
    }
    setFocusedCommentId(null);
  };

  const updateComment = hooks.useUpdateComment(closeEditor);
  const deleteComment = hooks.useDeleteComment();

  useEffect(function focusText() {
    const { length } = textareaNode.current.value;
    textareaNode.current.focus();
    textareaNode.current.setSelectionRange(length, length);
  }, []);

  const replyToCommentCallback = id => {
    setFocusedCommentId(id);
    closeEditor();
  };

  const addCommentReply = hooks.useAddCommentReply(replyToCommentCallback);

  const replyToComment = () => {
    if (!inputValue) {
      closeEditor();
      return;
    }

    const newReply = {
      parent_id: comment.id,
      content: inputValue,
      recording_id: comment.recording_id,
      time: comment.time,
      point: comment.point,
      has_frames: comment.has_frames,
    };

    addCommentReply({
      variables: { object: newReply },
    });
  };

  const onKeyDown = e => {
    if (e.key == "Escape") {
      cancelEditingComment(e);
    } else if (e.key == "Enter" && (e.metaKey || e.ctrlKey)) {
      saveEditedComment();
    }
  };
  const saveEditedComment = () => {
    closeEditor();
    // If there's no input value, delete the comment
    if (!inputValue) {
      deleteComment({ variables: { commentId: comment.id } });
      return;
    }

    updateComment({
      variables: { newContent: inputValue, commentId: comment.id },
    });
  };
  const cancelEditingComment = e => {
    closeEditor();
    // If this was a new comment and it was left empty, delete it.
    if (!comment.content) {
      deleteComment({ variables: { commentId: comment.id } });
    }
  };

  return (
    <div className="editor">
      <textarea
        defaultValue={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={onKeyDown}
        ref={textareaNode}
      />
      <div className="buttons">
        <button className="cancel" onClick={cancelEditingComment}>
          Cancel
        </button>
        <button className="save" onClick={replying ? replyToComment : saveEditedComment}>
          Save
        </button>
      </div>
    </div>
  );
}

export default connect(() => ({}), {
  setFocusedCommentId: actions.setFocusedCommentId,
})(CommentEditor);
