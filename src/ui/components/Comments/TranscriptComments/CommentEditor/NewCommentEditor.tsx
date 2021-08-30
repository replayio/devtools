import React from "react";
import { connect, ConnectedProps } from "react-redux";
import hooks from "ui/hooks";
import { actions } from "ui/actions";
import { PendingNewComment, PendingNewReply } from "ui/state/comments";
import CommentEditor from "./CommentEditor";
import { useAuth0 } from "@auth0/auth0-react";
import { setModal } from "ui/actions/app";

interface NewCommentEditorProps extends PropsFromRedux {
  comment: PendingNewComment | PendingNewReply;
  type: "new_reply" | "new_comment";
}

function NewCommentEditor({ comment, type, clearPendingComment, setModal }: NewCommentEditorProps) {
  const { isAuthenticated } = useAuth0();
  const recordingId = hooks.useGetRecordingId();
  const addComment = hooks.useAddComment();
  const addCommentReply = hooks.useAddCommentReply();

  const handleSubmit = (inputValue: string) => {
    if (!isAuthenticated) {
      setModal("login");
      return;
    }

    if (type == "new_reply") {
      handleReplySave(comment as PendingNewReply, inputValue);
    } else {
      handleNewSave(comment as PendingNewComment, inputValue);
    }

    clearPendingComment();
  };

  const handleReplySave = async (comment: PendingNewReply, inputValue: string) => {
    // For now we can simply bail if the input happens to be empty. We should fix
    // this in the next pass to handle and show an error prompt.
    if (inputValue == "") {
      return;
    }

    const { parentId } = comment;

    const reply = {
      content: inputValue,
      commentId: parentId,
    };

    addCommentReply(reply, recordingId!);
  };
  const handleNewSave = async (comment: PendingNewComment, inputValue: string) => {
    // For now we can simply bail if the input happens to be empty. We should fix
    // this in the next pass to handle and show an error prompt.
    if (inputValue == "") {
      return;
    }

    const { primaryLabel, secondaryLabel, time, point, hasFrames, sourceLocation } = comment;

    const newComment = {
      content: inputValue,
      primaryLabel,
      secondaryLabel,
      point,
      time,
      hasFrames,
      sourceLocation,
      recordingId,
      position: comment.position
        ? {
            x: comment.position?.x,
            y: comment.position?.y,
          }
        : null,
    };

    addComment(newComment, recordingId!);
  };

  return <CommentEditor {...{ comment, handleSubmit }} />;
}

const connector = connect(null, {
  clearPendingComment: actions.clearPendingComment,
  setModal: actions.setModal,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(NewCommentEditor);
