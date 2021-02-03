import React, { useState, useRef, useEffect } from "react";
import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import hooks from "ui/hooks";
import { actions } from "ui/actions";
import CommentTool from "ui/components/shared/CommentTool";

function CommentEditor({ comment, clearPendingComment, pendingComment }) {
  const [inputValue, setInputValue] = useState(comment.content);
  const textareaNode = useRef(null);
  const editorNode = useRef(null);

  const addComment = hooks.useAddComment(clearPendingComment);
  const updateComment = hooks.useUpdateComment(clearPendingComment);
  const deleteComment = hooks.useDeleteComment();

  useEffect(() => {
    const { length } = textareaNode.current.value;
    textareaNode.current.focus();
    textareaNode.current.setSelectionRange(length, length);
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
      console.log(pendingComment.position);
      updateComment({
        variables: {
          newContent: inputValue,
          commentId: comment.id,
          position: JSON.stringify(pendingComment.position),
        },
      });
    }
  };
  const handleCancel = () => {
    clearPendingComment();
  };

  return (
    <div className="editor" ref={editorNode} onClick={e => e.stopPropagation()}>
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
      {pendingComment.parent_id ? null : <CommentTool comment={comment} />}
    </div>
  );
}

export default connect(
  state => ({
    pendingComment: selectors.getPendingComment(state),
  }),
  {
    clearPendingComment: actions.clearPendingComment,
  }
)(CommentEditor);
