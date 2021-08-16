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
import classNames from "classnames";

type CommentEditorProps = PropsFromRedux & {
  comment: Comment | PendingNewComment | PendingNewReply | PendingEditReply | PendingEditComment;
  handleSubmit: (inputValue: string) => void;
};

function CommentEditor({ comment, handleSubmit, clearPendingComment }: CommentEditorProps) {
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
  };

  const onSubmit = () => {
    if (api) {
      handleSubmit(api.getText());
    }
  };

  return (
    <div className="comment-input-container p-2" onClick={e => e.stopPropagation()}>
      <div className="comment-input text-lg">
        <DraftJSEditor
          handleCancel={handleCancel}
          handleSubmit={handleSubmit}
          initialContent={comment.content}
          placeholder={comment.content == "" ? "Type a comment" : ""}
          api={setApi}
          onChangeCallback={onChangeCallback}
          users={users}
        />
      </div>
      <div className="flex justify-end space-x-2">
        <button
          onClick={clearPendingComment}
          className={classNames(
            "justify-center py-2 px-4 text-lg font-medium text-black underline"
          )}
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={!submitEnabled}
          className={classNames(
            "justify-center py-2 px-4 rounded-md shadow-sm text-lg font-medium",
            submitEnabled
              ? "bg-primaryAccent text-white hover:bg-primaryAccentHover"
              : "text-white bg-gray-300"
          )}
        >
          Post
        </button>
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
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(CommentEditor);
