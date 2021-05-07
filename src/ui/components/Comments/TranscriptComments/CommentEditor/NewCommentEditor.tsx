import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import hooks from "ui/hooks";
import { actions } from "ui/actions";
import { UIState } from "ui/state";
import { PendingNewComment, PendingNewReply } from "ui/state/comments";
import CommentEditor from "./CommentEditor";

interface NewCommentEditorProps extends PropsFromRedux {
  comment: PendingNewComment | PendingNewReply;
  type: "new_reply" | "new_comment";
}

function NewCommentEditor({
  comment,
  type,
  clearPendingComment,
  recordingId,
  canvas,
}: NewCommentEditorProps) {
  const addComment = hooks.useAddComment();
  const addCommentReply = hooks.useAddCommentReply();

  const handleSubmit = (inputValue: string) => {
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

    const { time, point, hasFrames, sourceLocation } = comment;

    const newComment = {
      content: inputValue,
      point,
      time,
      hasFrames,
      sourceLocation,
      recordingId,
      position: {
        x: comment.position?.x,
        y: comment.position?.y,
      },
    };

    addComment(newComment, recordingId!);
  };

  return <CommentEditor {...{ comment, handleSubmit }} />;
}

const connector = connect(
  (state: UIState) => ({
    recordingId: selectors.getRecordingId(state),
    canvas: selectors.getCanvas(state),
  }),
  { clearPendingComment: actions.clearPendingComment }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(NewCommentEditor);
