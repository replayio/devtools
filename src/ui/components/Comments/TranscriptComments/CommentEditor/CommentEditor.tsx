import { EditorState } from "draft-js";
import React, { useMemo } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { UIState } from "ui/state";
import hooks from "ui/hooks";
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
import { convertToMarkdown } from "./mention";

type CommentEditorProps = PropsFromRedux & {
  comment: Comment | PendingNewComment | PendingNewReply | PendingEditReply | PendingEditComment;
  handleSubmit: (inputValue: string) => void;
};

function CommentEditor({
  pendingComment,
  comment,
  handleSubmit,
  clearPendingComment,
  recordingId,
}: CommentEditorProps) {
  const { collaborators, recording } = hooks.useGetOwnersAndCollaborators(recordingId!);

  const users = useMemo(
    () =>
      collaborators && recording ? [...collaborators.map(c => c.user), recording.user] : undefined,
    [collaborators, recording]
  );

  const { user } = useAuth0();
  const { editorState, setEditorState, config } = useEditor({
    content: comment.content,
    users,
  });

  const submit = (state?: EditorState) => {
    if (!state) {
      handleSubmit("");
      return;
    }

    handleSubmit(convertToMarkdown(state));
  };

  const handleCancel = () => {
    clearPendingComment();
  };

  return (
    <div className="comment-input-container" onClick={e => e.stopPropagation()}>
      <div className="comment-input">
        <img src={user.picture} className="comment-picture" />
        {config && editorState && users ? (
          <DraftJSEditor
            {...config}
            editorState={editorState}
            handleCancel={handleCancel}
            handleSubmit={submit}
            initialContent={comment.content}
            placeholder={comment.content == "" ? "Type a comment" : ""}
            setEditorState={setEditorState}
            users={users}
          />
        ) : null}
      </div>
      <div className="comment-input-actions">
        <button className="action-cancel" onClick={handleCancel}>
          Cancel
        </button>
        <button className="action-submit" onClick={() => submit(editorState)}>
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
