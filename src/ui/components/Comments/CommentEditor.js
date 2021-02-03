import React, { useState, useRef, useEffect } from "react";
import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import hooks from "ui/hooks";
import { actions } from "ui/actions";
import CommentTool from "ui/components/shared/CommentTool";

function CommentEditor({
  comment,
  stopEditing,
  clearPendingComment,
  pendingComment,
  activeComment,
  setActiveComment,
}) {
  const [inputValue, setInputValue] = useState(comment.content);
  const textareaNode = useRef(null);
  const editorNode = useRef(null);

  const addComment = hooks.useAddComment(() => clearPendingComment());
  const updateComment = hooks.useUpdateComment(stopEditing);
  const deleteComment = hooks.useDeleteComment();

  useEffect(() => {
    const { length } = textareaNode.current.value;
    textareaNode.current.focus();
    textareaNode.current.setSelectionRange(length, length);

    if (!pendingComment) {
      console.log("is this running");
      setActiveComment(comment);
    }

    return () => setActiveComment(null);
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
      console.log(">>", activeComment.position, JSON.stringify(activeComment.position));
      updateComment({
        variables: {
          newContent: inputValue,
          commentId: comment.id,
          position: activeComment.position,
        },
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
      <CommentTool comment={comment} />
    </div>
  );
}

export default connect(
  state => ({
    pendingComment: selectors.getPendingComment(state),
    activeComment: selectors.getActiveComment(state),
  }),
  {
    clearPendingComment: actions.clearPendingComment,
    setActiveComment: actions.setActiveComment,
  }
)(CommentEditor);
