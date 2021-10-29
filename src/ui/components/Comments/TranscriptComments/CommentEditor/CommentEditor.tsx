import React, { useEffect, useMemo } from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { UIState } from "ui/state";
import hooks from "ui/hooks";
import { Comment, isReply, PendingComment, Remark, Reply } from "ui/state/comments";

import "./CommentEditor.css";
import { User } from "ui/types";
import TipTapEditor from "./TipTapEditor";
import { FocusContext } from "../CommentCard";
import classNames from "classnames";

/**
 * Updates the `content` field of a Reply or Comment in such a way that
 * TypeScript doesn't complain at you.
 */
function updateCommentContent<P extends PendingComment>(pending: P, content: string): P {
  return {
    ...pending,
    comment: { ...pending.comment, content },
  };
}

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
  pendingComment,
  setPendingComment,
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

  const handleBlur = (nextContent: string) => {
    const prevContent = pendingComment?.comment.content || "";
    if (pendingComment && nextContent !== prevContent) {
      setPendingComment(updateCommentContent(pendingComment, nextContent));
    }

    blur();
  };

  return (
    <div className="comment-input-container">
      <div className={classNames("comment-input")}>
        <FocusContext.Consumer>
          {({ autofocus, blur, close, isFocused }) => (
            <TipTapEditor
              autofocus={autofocus}
              blur={handleBlur}
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
  { clearPendingComment: actions.clearPendingComment, setPendingComment: actions.setPendingComment }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(CommentEditor);
