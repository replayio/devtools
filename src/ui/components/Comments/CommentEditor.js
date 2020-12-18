import React, { useState, useRef, useEffect } from "react";

import { connect } from "react-redux";
import { actions } from "ui/actions";
import { gql, useMutation } from "@apollo/client";

const UPDATE_COMMENT_CONTENT = gql`
  mutation UpdateCommentContent($newContent: String, $commentId: uuid) {
    update_comments(_set: { content: $newContent }, where: { id: { _eq: $commentId } }) {
      returning {
        id
        content
      }
    }
  }
`;

const DELETE_COMMENT = gql`
  mutation DeleteComment($commentId: uuid) {
    delete_comments(where: { id: { _eq: $commentId } }) {
      returning {
        id
      }
    }
  }
`;

function CommentEditor({ comment, stopEditing, unfocusComment, setFocusedCommentId }) {
  const [inputValue, setInputValue] = useState(comment.content);
  const textareaNode = useRef(null);
  const [updateCommentContent] = useMutation(UPDATE_COMMENT_CONTENT, {
    onCompleted: () => {
      stopEditing();
      setFocusedCommentId(null);
    },
  });
  const [deleteComment] = useMutation(DELETE_COMMENT, {
    refetchQueries: ["GetComments"],
  });

  useEffect(function focusText() {
    const { length } = textareaNode.current.value;
    textareaNode.current.focus();
    textareaNode.current.setSelectionRange(length, length);
  }, []);

  const onKeyDown = e => {
    if (e.key == "Escape") {
      stopEditingComment(e);
    } else if (e.key == "Enter" && (e.metaKey || e.ctrlKey)) {
      saveEditedComment();
    }
  };
  const saveEditedComment = () => {
    updateCommentContent({
      variables: { newContent: inputValue, commentId: comment.id },
    });
  };
  const stopEditingComment = e => {
    stopEditing();
    setFocusedCommentId(null);

    // If this was a new comment and it was left empty, delete it.
    if (!comment.content && !inputValue) {
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
        <button className="cancel" onClick={stopEditingComment}>
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
