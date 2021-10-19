import React, { useMemo } from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { UIState } from "ui/state";
import { Comment, PendingNewComment, PendingNewReply, Reply } from "ui/state/comments";

import "./CommentEditor.css";
import TipTapEditor from "./TipTapEditor";
import { FocusContext } from "../CommentCard";
import classNames from "classnames";

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
  return (
    <div className="comment-input-container">
      <div className={classNames("comment-input")}>
        <FocusContext.Consumer>
          {({ autofocus, blur, isFocused }) => (
            <TipTapEditor
              autofocus={autofocus}
              blur={blur}
              content={comment.content || ""}
              editable={editable}
              handleCancel={() => {
                clearPendingComment();
              }}
              handleSubmit={handleSubmit}
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
