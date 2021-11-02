import React, { useEffect, useMemo } from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { UIState } from "ui/state";
import hooks from "ui/hooks";
import { Comment, Reply } from "ui/state/comments";

// import "./CommentEditor.css";
import { User } from "ui/types";
import TipTapEditor from "./TipTapEditor";
import { FocusContext } from "../CommentCard";
import classNames from "classnames";

type CommentEditorProps = PropsFromRedux & {
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
    <div className="comment-input-container">
      <div className={classNames("comment-input")}>
        <FocusContext.Consumer>
          {({ autofocus, blur, close, isFocused }) => (
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

const connector = connect(
  (state: UIState) => ({
    pendingComment: selectors.getPendingComment(state),
  }),
  { clearPendingComment: actions.clearPendingComment }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(CommentEditor);
