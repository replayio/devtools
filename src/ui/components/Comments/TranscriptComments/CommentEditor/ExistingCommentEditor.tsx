import React from "react";
import { connect, ConnectedProps } from "react-redux";
import hooks from "ui/hooks";
import { actions } from "ui/actions";
import CommentEditor from "./CommentEditor";
import {
  Comment,
  PendingComment,
  PendingNewComment,
  PendingNewReply,
  Reply,
} from "ui/state/comments";

type ExistingCommentEditorProps = PropsFromRedux & {
  comment: Comment | Reply | PendingNewComment | PendingNewReply;
  pendingComment: PendingComment | null;
};

function ExistingCommentEditor({
  comment,
  pendingComment,
  clearPendingComment,
}: ExistingCommentEditorProps) {
  const updateComment = hooks.useUpdateComment();
  const updateCommentReply = hooks.useUpdateCommentReply();

  const handleSubmit = (inputValue: string) => {
    if (pendingComment?.type === "edit_comment") {
      updateComment(pendingComment.comment.id, inputValue, pendingComment.comment.position);
    } else if (pendingComment?.type === "edit_reply") {
      updateCommentReply(pendingComment.comment.id, inputValue);
    }
    clearPendingComment();
  };

  return (
    <CommentEditor
      editable={pendingComment?.comment?.id === comment.id}
      comment={comment}
      handleSubmit={handleSubmit}
    />
  );
}

const connector = connect(null, { clearPendingComment: actions.clearPendingComment });
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(ExistingCommentEditor);
