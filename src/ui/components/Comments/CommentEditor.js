import React, { useState, useRef, useEffect } from "react";
import { connect } from "react-redux";
import hooks from "ui/hooks";
import { actions } from "ui/actions";

function CommentEditor({ comment, stopEditing, clearPendingComment }) {
  const [inputValue, setInputValue] = useState(comment.content);
  const textareaNode = useRef(null);
  const editorNode = useRef(null);
  const intervalKey = useRef(null);

  const addComment = hooks.useAddComment(() => clearPendingComment());
  const updateComment = hooks.useUpdateComment(stopEditing);
  const deleteComment = hooks.useDeleteComment();

  useEffect(() => {
    const { length } = textareaNode.current.value;
    textareaNode.current.focus();
    textareaNode.current.setSelectionRange(length, length);

    // To avoid open editors from lingering without the user realizing,
    // we close editing mode once they shift focus from the comment editor.
    intervalKey.current = setInterval(function checkFocusInEditor() {
      if (!editorNode.current.contains(document.activeElement)) {
        handleCancel();
        clearInterval(intervalKey.current);
      }
    }, 1000);

    return () => clearInterval(intervalKey.current);
  }, []);

  const onKeyDown = e => {
    if (e.key == "Escape") {
      handleCancel(e);
    } else if (e.key == "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSave();
    }
  };
  const handleSave = () => {
    if (comment.content === "") {
      handleNewSave();
    } else {
      handleExistingSave();
    }
  };
  const handleNewSave = () => {
    if (inputValue) {
      const newComment = {
        ...comment,
        content: inputValue,
        position: JSON.stringify(comment.position),
      };
      addComment({
        variables: { object: newComment },
      });
    } else {
      clearPendingComment();
    }
  };
  const handleExistingSave = () => {
    if (!inputValue) {
      deleteComment({ variables: { commentId: comment.id } });
    } else {
      updateComment({
        variables: { newContent: inputValue, commentId: comment.id },
      });
    }

    stopEditing();
  };
  const handleCancel = () => {
    if (comment.content === "") {
      clearPendingComment();
    }
    stopEditing();
  };

  return (
    <div className="editor" ref={editorNode}>
      <textarea
        defaultValue={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={onKeyDown}
        ref={textareaNode}
      />
      <div className="buttons">
        <button className="cancel" onClick={handleCancel}>
          Cancel
        </button>
        <button className="save" onClick={handleSave}>
          {comment.parent_id ? "Reply" : "Save"}
        </button>
      </div>
    </div>
  );
}

export default connect(null, { clearPendingComment: actions.clearPendingComment })(CommentEditor);
