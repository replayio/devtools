import React from "react";
import { connect, ConnectedProps } from "react-redux";
import hooks from "ui/hooks";
import { actions } from "ui/actions";
import { PendingEditComment, PendingEditReply } from "ui/state/comments";
import CommentEditor from "./CommentEditor";
import { User } from "ui/components/shared/SharingModal/types";

type ExistingCommentEditorProps = PropsFromRedux & {
  collaborators?: User[];
  comment: PendingEditComment | PendingEditReply;
};

function ExistingCommentEditor({
  collaborators,
  comment,
  clearPendingComment,
}: ExistingCommentEditorProps) {
  const updateComment = hooks.useUpdateComment(clearPendingComment);

  const handleSubmit = (inputValue: string) => {
    handleExistingSave(comment, inputValue);
  };
  const handleExistingSave = (
    pendingComment: PendingEditComment | PendingEditReply,
    inputValue: string
  ) => {
    const { id, position } = pendingComment;

    updateComment({
      variables: {
        newContent: inputValue,
        commentId: id,
        position,
      },
    });
  };

  return <CommentEditor {...{ comment, collaborators, handleSubmit }} />;
}

const connector = connect(null, { clearPendingComment: actions.clearPendingComment });
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(ExistingCommentEditor);
