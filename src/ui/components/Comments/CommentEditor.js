import React, { useState, useRef, useEffect } from "react";
import { connect } from "react-redux";
import hooks from "ui/hooks";
import { actions } from "ui/actions";

function CommentEditor({ comment, stopEditing, stopReplying, replying, clearPendingComment }) {
  const [inputValue, setInputValue] = useState(replying ? null : comment.content);
  const textareaNode = useRef(null);
  const editorNode = useRef(null);
  const intervalKey = useRef(null);

  const closeEditor = () => {
    if (replying) {
      stopReplying();
    } else {
      stopEditing();
    }
  };

  const addComment = hooks.useAddComment(() => clearPendingComment());
  const updateComment = hooks.useUpdateComment(closeEditor);
  const deleteComment = hooks.useDeleteComment();

  useEffect(() => {
    const { length } = textareaNode.current.value;
    textareaNode.current.focus();
    textareaNode.current.setSelectionRange(length, length);

    intervalKey.current = setInterval(function checkFocusInEditor() {
      if (!editorNode.current.contains(document.activeElement)) {
        cancelEditingComment();
        clearInterval(intervalKey.current);
      }
    }, 1000);

    return () => clearInterval(intervalKey.current);
  }, []);

  const replyToCommentCallback = () => {
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
      replying ? replyToComment() : saveEditedComment();
    }
  };
  const saveEditedComment = () => {
    closeEditor();
    // If there's no input value, delete the comment.
    if (!inputValue) {
      return deleteComment({ variables: { commentId: comment.id } });
    }

    // If this is a pending comment, clear it from store and save
    // it to Hasura. Otherwise, update the existing comment.
    if (comment.content === "") {
      comment.content = inputValue;
      return addComment({
        variables: { object: comment },
      });
    } else {
      updateComment({
        variables: { newContent: inputValue, commentId: comment.id },
      });
    }
  };
  const cancelEditingComment = e => {
    if (comment.content === "") {
      clearPendingComment();
    }
    closeEditor();
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

export default connect(null, { clearPendingComment: actions.clearPendingComment })(CommentEditor);
