import "./CommentEditor.module.css";
import React from "react";
import TipTapEditor from "./TipTapEditor";
import classNames from "classnames";
import { Comment, Reply } from "ui/state/comments";
import { FocusContext } from "../CommentCard";
import { User } from "ui/types";

export function getCommentEditorDOMId(comment: Comment | Reply) {
  return `comment-editor-${comment.id}`;
}

type CommentEditorProps = {
  clearPendingComment: () => void;
  comment: Comment | Reply;
  editable: boolean;
  handleSubmit: (inputValue: string) => void;
};

function CommentEditor({
  clearPendingComment,
  comment,
  editable,
  handleSubmit,
}: CommentEditorProps) {
  // const { collaborators, recording, loading } = hooks.useGetOwnersAndCollaborators(comment.recordingId);

  const users: User[] = []; //useMemo(
  //   () =>
  //     collaborators && recording
  //       ? ([...collaborators.map(c => c.user), recording.user].filter(Boolean) as User[])
  //       : undefined,
  //   [loading]
  // );

  return (
    <div className="comment-input-container" id={getCommentEditorDOMId(comment)}>
      <div className={classNames("comment-input")}>
        <FocusContext.Consumer>
          {({
            autofocus,
            blur,
            close,
            isFocused,
          }: {
            autofocus: boolean;
            blur: () => void;
            close: () => void;
            isFocused: boolean;
          }) => (
            <TipTapEditor
              key={comment.updatedAt}
              autofocus={autofocus}
              blur={blur}
              close={close}
              content={comment.content || ""}
              editable={editable}
              handleCancel={() => {
                clearPendingComment();
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
            />
          )}
        </FocusContext.Consumer>
      </div>
    </div>
  );
}

export default CommentEditor;
