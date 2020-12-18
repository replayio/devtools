import React, { useState, useRef, useEffect } from "react";

import { connect } from "react-redux";
import { actions } from "ui/actions";
import hooks from "ui/hooks";

function CommentEditor({ comment, stopEditing, setFocusedCommentId }) {
  const [inputValue, setInputValue] = useState(comment.content);
  const textareaNode = useRef(null);

  const closeEditor = () => {
    stopEditing();
    setFocusedCommentId(null);
  };

  const updateComment = hooks.useUpdateComment(closeEditor);
  const deleteComment = hooks.useDeleteComment();

  useEffect(function focusText() {
    const { length } = textareaNode.current.value;
    textareaNode.current.focus();
    textareaNode.current.setSelectionRange(length, length);
  }, []);

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
        defaultValue={comment.content}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={onKeyDown}
        ref={textareaNode}
      />
      <div className="buttons">
        <button className="cancel" onClick={cancelEditingComment}>
          Cancel
        </button>
        <button className="save" onClick={saveEditedComment}>
          Save
        </button>
      </div>
    </div>
  );
}

export default connect(() => ({}), {
  setFocusedCommentId: actions.setFocusedCommentId,
})(CommentEditor);
