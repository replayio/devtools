import React, { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { UIState } from "ui/state";
import CommentTool from "ui/components/shared/CommentTool";
import DraftJSEditorLoader from "./DraftJSEditorLoader";
import "./CommentEditor.css";
import {
  Comment,
  PendingEditComment,
  PendingEditReply,
  PendingNewComment,
  PendingNewReply,
} from "ui/state/comments";

type CommentEditorProps = PropsFromRedux & {
  comment: Comment | PendingNewComment | PendingNewReply | PendingEditReply | PendingEditComment;
  handleSubmit: (inputValue: string) => void;
};

function CommentEditor({ comment, handleSubmit, clearPendingComment }: CommentEditorProps) {
  const { user } = useAuth0();
  const [editorState, setEditorState] = useState<any>(null);
  const [DraftJS, setDraftJS] = useState();
  const isNewComment = comment.content == "" && !("parent_id" in comment);

  const inputValue = editorState ? editorState.getCurrentContent().getPlainText() : "";

  const handleCancel = () => {
    clearPendingComment();
  };

  return (
    <div className="comment-input-container" onClick={e => e.stopPropagation()}>
      <div className="comment-input">
        <img src={user.picture} className="comment-picture" />
        <DraftJSEditorLoader
          {...{
            editorState,
            setEditorState,
            DraftJS,
            setDraftJS,
            handleSubmit,
            handleCancel,
            placeholder: comment.content == "" ? "Type a comment" : "",
            initialContent: comment.content,
          }}
        />
      </div>
      <div className="comment-input-actions">
        <button className="action-cancel" onClick={handleCancel}>
          Cancel
        </button>
        <button className="action-submit" onClick={() => handleSubmit(inputValue)}>
          Submit
        </button>
      </div>
      {isNewComment && <CommentTool comment={comment} />}
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    recordingId: selectors.getRecordingId(state),
    currentTime: selectors.getCurrentTime(state),
    pendingComment: selectors.getPendingComment(state),
    canvas: selectors.getCanvas(state),
  }),
  {
    clearPendingComment: actions.clearPendingComment,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(CommentEditor);
