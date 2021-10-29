import React from "react";
import { connect, ConnectedProps } from "react-redux";
import hooks from "ui/hooks";
import { actions } from "ui/actions";
import CommentEditor from "./CommentEditor";
import { Comment, Reply } from "ui/state/comments";

type ExistingCommentEditorProps = PropsFromRedux & {
  comment: Comment | Reply;
  editable: boolean;
  type: "comment" | "reply";
};

function ExistingCommentEditor({
  comment,
  clearPendingComment,
  editable,
  type,
}: ExistingCommentEditorProps) {
  const updateComment = hooks.useUpdateComment();
  const updateCommentReply = hooks.useUpdateCommentReply();

  const handleSubmit = (inputValue: string) => {
    if (type === "comment") {
      updateComment(comment.id, inputValue, (comment as Comment).position);
    } else if (type === "reply") {
      updateCommentReply(comment.id, inputValue);
    }
    clearPendingComment();
  };

  return <CommentEditor editable={editable} comment={comment} handleSubmit={handleSubmit} />;
}

const connector = connect(null, { clearPendingComment: actions.clearPendingComment });
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(ExistingCommentEditor);
