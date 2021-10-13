import React, { useMemo } from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { UIState } from "ui/state";
import hooks from "ui/hooks";
import { Comment, PendingNewComment, PendingNewReply, Reply } from "ui/state/comments";

import "./CommentEditor.css";
import { User } from "ui/types";
import TipTapEditor from "./TipTapEditor";

type CommentEditorProps = PropsFromRedux & {
  comment: Comment | Reply | PendingNewComment | PendingNewReply;
  editable: boolean;
  handleSubmit: (inputValue: string) => void;
};

function CommentEditor({
  clearPendingComment,
  comment,
  editable,
  handleSubmit,
}: CommentEditorProps) {
  const recordingId = hooks.useGetRecordingId();
  const { collaborators, recording, loading } = hooks.useGetOwnersAndCollaborators(recordingId!);

  const users = useMemo(
    () =>
      collaborators && recording
        ? ([...collaborators.map(c => c.user), recording.user].filter(Boolean) as User[])
        : undefined,
    [loading]
  );

  return (
    <div className="comment-input-container" onClick={e => e.stopPropagation()}>
      <div className="comment-input">
        <TipTapEditor
          content={comment.content || ""}
          editable={editable}
          handleCancel={clearPendingComment}
          handleSubmit={handleSubmit}
          possibleMentions={users || []}
          placeholder={
            comment.content == ""
              ? "parentId" in comment
                ? "Write a reply..."
                : "Type a comment"
              : ""
          }
        />
      </div>
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    pendingComment: selectors.getPendingComment(state),
  }),
  { clearPendingComment: actions.clearPendingComment }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(CommentEditor);
