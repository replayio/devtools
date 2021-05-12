import React from "react";
import { connect, ConnectedProps } from "react-redux";
import hooks from "ui/hooks";
import { actions } from "ui/actions";
import { PendingEditComment, PendingEditReply } from "ui/state/comments";
import CommentEditor from "./CommentEditor";

type ExistingCommentEditorProps = PropsFromRedux & {
  comment: PendingEditComment | PendingEditReply;
  type: "edit_comment" | "edit_reply";
};

function ExistingCommentEditor({ comment, type, clearPendingComment }: ExistingCommentEditorProps) {
  const updateComment = hooks.useUpdateComment();
  const updateCommentReply = hooks.useUpdateCommentReply();

  const handleSubmit = (inputValue: string) => {
    handleExistingSave(comment, inputValue);
    clearPendingComment();
  };
  const handleExistingSave = (
    pendingComment: PendingEditComment | PendingEditReply,
    inputValue: string
  ) => {
    const { id } = pendingComment;

    if (type === "edit_comment") {
      updateComment({
        variables: {
          newContent: inputValue,
          commentId: id,
          position: pendingComment.position,
        },
      });
    } else {
      updateCommentReply({
        variables: {
          newContent: inputValue,
          commentId: id,
        },
      });
    }
  };

  return <CommentEditor {...{ comment, handleSubmit }} />;
}

const connector = connect(null, { clearPendingComment: actions.clearPendingComment });
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(ExistingCommentEditor);
