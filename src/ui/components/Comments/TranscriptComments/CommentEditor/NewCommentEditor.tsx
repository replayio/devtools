import React from "react";
import { connect, ConnectedProps } from "react-redux";
import hooks from "ui/hooks";
import { actions } from "ui/actions";
import { Comment, Reply } from "ui/state/comments";
import CommentEditor from "./CommentEditor";
import { useAuth0 } from "@auth0/auth0-react";

interface NewCommentEditorProps extends PropsFromRedux {
  comment: Comment | Reply;
  type: "new_reply" | "new_comment";
}

function NewCommentEditor({ clearPendingComment, comment, setModal, type }: NewCommentEditorProps) {
  const { isAuthenticated } = useAuth0();
  const addComment = hooks.useAddComment();
  const addCommentReply = hooks.useAddCommentReply();

  const handleSubmit = (inputValue: string) => {
    if (!isAuthenticated) {
      setModal("login");
      return;
    }

    if (type == "new_reply") {
      handleReplySave(comment as Reply, inputValue);
    } else {
      handleNewSave(comment as Comment, inputValue);
    }

    clearPendingComment();
  };

  const handleReplySave = async (comment: Reply, inputValue: string) => {
    const reply = {
      ...comment,
      content: inputValue,
    };

    addCommentReply(reply);
  };

  const handleNewSave = async (comment: Comment, inputValue: string) => {
    const newComment = {
      ...comment,
      content: inputValue,
    };

    addComment(newComment);
  };

  return <CommentEditor editable={true} {...{ comment, handleSubmit }} />;
}

const connector = connect(null, {
  clearPendingComment: actions.clearPendingComment,
  setModal: actions.setModal,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(NewCommentEditor);
