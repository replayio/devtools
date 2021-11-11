import React from "react";
import { connect, ConnectedProps } from "react-redux";
import hooks from "ui/hooks";
import { actions } from "ui/actions";
import CommentEditor from "./CommentEditor";
import { Comment, Reply } from "ui/state/comments";
import { useGetUserId } from "ui/hooks/users";

type ExistingCommentEditorProps = {
  clearPendingComment: () => void;
  comment: Comment | Reply;
  editable: boolean;
  editItem: (comment: Comment | Reply) => void;
  type: "comment" | "reply";
};

function ExistingCommentEditor({
  comment,
  clearPendingComment,
  editable,
  editItem,
  type,
}: ExistingCommentEditorProps) {
  // const { userId } = useGetUserId();
  // const updateComment = hooks.useUpdateComment();
  // const updateCommentReply = hooks.useUpdateCommentReply();

  const handleSubmit = (inputValue: string) => {
    if (type === "comment") {
      // updateComment(comment.id, inputValue, (comment as Comment).position);
    } else if (type === "reply") {
      // updateCommentReply(comment.id, inputValue);
    }
    clearPendingComment();
  };

  return (
    <div
      onDoubleClick={() => {
        // if (comment.user.id === userId) {
        //   editItem(comment);
        // }
      }}
    >
      <CommentEditor
        clearPendingComment={clearPendingComment}
        editable={editable}
        comment={comment}
        handleSubmit={handleSubmit}
      />
    </div>
  );
}

export default ExistingCommentEditor;
