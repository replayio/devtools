import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { UIState } from "ui/state";
import CommentTool from "ui/components/shared/CommentTool";
import DraftJSEditor, { useEditor } from "./DraftJSEditor";
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

function CommentEditor({
  pendingComment,
  comment,
  handleSubmit,
  clearPendingComment,
}: CommentEditorProps) {
  const { user } = useAuth0();
  const { DraftJS, Editor, emojiPlugin, editorState, setEditorState } = useEditor(comment.content);

  const isNewComment = comment.content == "" && !("parent_id" in comment);

  const inputValue = editorState ? editorState.getCurrentContent().getPlainText() : "";

  const handleCancel = () => {
    clearPendingComment();
  };

  return (
    <div className="comment-input-container" onClick={e => e.stopPropagation()}>
      <div className="comment-input">
        <img src={user.picture} className="comment-picture" />
        {DraftJS && editorState ? (
          <DraftJSEditor
            DraftJS={DraftJS}
            Editor={Editor}
            editorState={editorState}
            emojiPlugin={emojiPlugin}
            handleCancel={handleCancel}
            handleSubmit={handleSubmit}
            initialContent={comment.content}
            placeholder={comment.content == "" ? "Type a comment" : ""}
            setEditorState={setEditorState}
          />
        ) : null}
      </div>
      <div className="comment-input-actions">
        <button className="action-cancel" onClick={handleCancel}>
          Cancel
        </button>
        <button className="action-submit" onClick={() => handleSubmit(inputValue)}>
          Submit
        </button>
      </div>
      {pendingComment &&
        pendingComment.comment.time == comment.time &&
        (pendingComment.type == "new_comment" || pendingComment.type == "edit_comment") && (
          <CommentTool pendingComment={pendingComment} />
        )}
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    recordingId: selectors.getRecordingId(state),
    pendingComment: selectors.getPendingComment(state),
  }),
  {
    clearPendingComment: actions.clearPendingComment,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(CommentEditor);
