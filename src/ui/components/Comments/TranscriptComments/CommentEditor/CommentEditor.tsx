import { Editor } from "@tiptap/react";
import classNames from "classnames";
import React, { useMemo } from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import hooks from "ui/hooks";
import { Comment, Reply } from "ui/state/comments";
import { User } from "ui/types";

import { FocusContext } from "../FocusContext";

import TipTapEditor from "./TipTapEditor";

export const PERSIST_COMMENT_DEBOUNCE_DELAY = 500;

export function getCommentEditorDOMId(comment: Comment | Reply) {
  return `comment-editor-${comment.id}`;
}

type CommentEditorProps = PropsFromRedux & {
  comment: Comment | Reply;
  disabled: boolean;
  editable: boolean;
  handleCancel?: () => void;
  handleSubmit?: (inputValue: string) => void;
  onCreate?: (editor: { editor: Pick<Editor, "commands"> }) => void;
  onUpdate?: (editor: { editor: Pick<Editor, "getJSON"> }) => void;
};

function CommentEditor({
  clearPendingComment,
  comment,
  disabled,
  editable,
  handleCancel = () => {},
  handleSubmit = () => {},
  onCreate = () => {},
  onUpdate = () => {},
}: CommentEditorProps) {
  const recordingId = hooks.useGetRecordingId();
  const { collaborators, recording, loading } = hooks.useGetOwnersAndCollaborators(recordingId!);

  const users = useMemo(
    () =>
      collaborators && recording
        ? ([...collaborators.map(c => c.user), recording.user].filter(Boolean) as User[])
        : undefined,
    [collaborators, recording]
  );

  return (
    <div className="comment-input-container" id={getCommentEditorDOMId(comment)}>
      <div className={classNames("comment-input")}>
        <FocusContext.Consumer>
          {({ autofocus, blur, close, isFocused }) => (
            <TipTapEditor
              key={comment.id}
              autofocus={autofocus}
              blur={blur}
              close={close}
              content={comment.content || ""}
              editable={editable && !disabled}
              handleCancel={() => {
                clearPendingComment();
                handleCancel();
                blur();
                close();
              }}
              handleSubmit={handleSubmit}
              possibleMentions={users || []}
              placeholder={
                comment.content == ""
                  ? "parentId" in comment
                    ? "Write a reply..."
                    : "Type a comment"
                  : ""
              }
              takeFocus={isFocused}
              onCreate={onCreate}
              onUpdate={onUpdate}
            />
          )}
        </FocusContext.Consumer>
      </div>
    </div>
  );
}

const connector = connect(null, { clearPendingComment: actions.clearPendingComment });
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(CommentEditor);
