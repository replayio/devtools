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
  const addComment = hooks.useAddComment(clearPendingComment);

  const handleSubmit = (inputValue: string) => {
    if (type == "new_reply") {
      handleReplySave(comment as PendingNewReply, inputValue);
    } else {
      handleNewSave(comment as PendingNewComment, inputValue);
    }
  };

  const handleReplySave = async (comment: PendingNewReply, inputValue: string) => {
    // For now we can simply bail if the input happens to be empty. We should fix
    // this in the next pass to handle and show an error prompt.
    if (inputValue == "") {
      return;
    }

    const { time, point, has_frames, source_location, parent_id } = comment;

    const reply = {
      content: inputValue,
      point,
      time,
      has_frames,
      source_location,
      parent_id,
      recording_id: recordingId,
      position: {
        x: canvas!.width * 0.5,
        y: canvas!.height * 0.5,
      },
    };

    addComment({ variables: { object: reply } });
  };
  const handleNewSave = async (comment: PendingNewComment, inputValue: string) => {
    // For now we can simply bail if the input happens to be empty. We should fix
    // this in the next pass to handle and show an error prompt.
    if (inputValue == "") {
      return;
    }

    const { time, point, has_frames, source_location } = comment;

    const newComment = {
      content: inputValue,
      point,
      time,
      has_frames,
      source_location,
      recording_id: recordingId,
      parent_id: null,
      position: {
        x: comment.position.x,
        y: comment.position.y,
      },
    };

    addComment({
      variables: { object: newComment },
    });
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
