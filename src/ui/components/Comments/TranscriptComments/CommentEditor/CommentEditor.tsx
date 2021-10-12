import React, { useMemo, useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { UIState } from "ui/state";
import hooks from "ui/hooks";
import {
  Comment,
  PendingEditComment,
  PendingEditReply,
  PendingNewComment,
  PendingNewReply,
} from "ui/state/comments";

import DraftJSEditor, { DraftJSAPI } from "./DraftJSEditor";
import "./CommentEditor.css";
import { User } from "ui/types";
import { DisabledSmButton, PrimarySmButton, SecondarySmButton } from "ui/components/shared/Button";

type CommentEditorProps = PropsFromRedux & {
  comment: Comment | PendingNewComment | PendingNewReply | PendingEditReply | PendingEditComment;
  handleSubmit: (inputValue: string) => void;
};

function CommentEditor({
  comment,
  handleSubmit,
  updatePendingCommentContent,
  clearPendingComment,
}: CommentEditorProps) {
  const recordingId = hooks.useGetRecordingId();
  const { collaborators, recording, loading } = hooks.useGetOwnersAndCollaborators(recordingId!);
  const [api, setApi] = useState<DraftJSAPI>();
  const [submitEnabled, setSubmitEnabled] = useState<boolean>(false);

  const users = useMemo(
    () =>
      collaborators && recording
        ? ([...collaborators.map(c => c.user), recording.user].filter(Boolean) as User[])
        : undefined,
    [loading]
  );

  const handleCancel = () => {
    clearPendingComment();
  };
  const onChangeCallback = () => {
    setSubmitEnabled(!!api?.getText().length);
    updatePendingCommentContent(api ? api.getText() : "");
  };

  return (
    <div className="comment-input-container" onClick={e => e.stopPropagation()}>
      <div className="comment-input">
        <DraftJSEditor
          handleCancel={handleCancel}
          handleSubmit={handleSubmit}
          initialContent={comment.content}
          placeholder={
            comment.content == ""
              ? "parentId" in comment
                ? "Write a reply..."
                : "Type a comment"
              : ""
          }
          api={setApi}
          onChangeCallback={onChangeCallback}
          users={users}
        />
      </div>
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    pendingComment: selectors.getPendingComment(state),
  }),
  {
    clearPendingComment: actions.clearPendingComment,
    updatePendingCommentContent: actions.updatePendingCommentContent,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(CommentEditor);
