import React, { useMemo, useState } from "react";
import useAuth0 from "ui/utils/useAuth0";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { UIState } from "ui/state";
import hooks from "ui/hooks";
import CommentTool from "ui/components/shared/CommentTool";
import {
  Comment,
  PendingEditComment,
  PendingEditReply,
  PendingNewComment,
  PendingNewReply,
} from "ui/state/comments";

import DraftJSEditor, { DraftJSAPI } from "./DraftJSEditor";
import "./CommentEditor.css";

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
  const [api, setApi] = useState<DraftJSAPI>();

  const users = useMemo(
    () =>
      collaborators && recording ? [...collaborators.map(c => c.user), recording.user] : undefined,
    [collaborators, recording]
  );

  const { user } = useAuth0();

  const handleCancel = () => {
    clearPendingComment();
  };

  return (
    <div className="comment-input-container" onClick={e => e.stopPropagation()}>
      <div className="comment-input">
        <img src={user.picture} className="comment-picture" />
        <DraftJSEditor
          handleCancel={handleCancel}
          handleSubmit={handleSubmit}
          initialContent={comment.content}
          placeholder={comment.content == "" ? "Type a comment" : ""}
          api={setApi}
          users={users}
        />
      </div>
      <div className="comment-input-actions">
        <button className="action-cancel" onClick={handleCancel}>
          Cancel
        </button>
        <button className="action-submit" onClick={() => api && handleSubmit(api.getText())}>
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
