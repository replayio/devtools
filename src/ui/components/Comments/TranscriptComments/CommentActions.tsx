import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import PortalDropdown from "ui/components/shared/PortalDropdown";
import { Comment, Reply } from "ui/state/comments";
import { actions } from "ui/actions";
import hooks from "ui/hooks";
import "./CommentActions.css";
import { DotsHorizontalIcon } from "@heroicons/react/solid";
import { UIState } from "ui/state";
import { getRecordingId } from "ui/reducers/app";

type CommentActionsProps = PropsFromRedux & {
  comment: Comment | Reply;
  isRoot: boolean;
};

function CommentActions({ comment, editItem, isRoot, recordingId }: CommentActionsProps) {
  const { userId } = hooks.useGetUserId();
  const deleteComment = hooks.useDeleteComment();
  const deleteCommentReply = hooks.useDeleteCommentReply();
  const [expanded, setExpanded] = useState(false);

  const isCommentAuthor = userId === comment.user.id;

  if (!isCommentAuthor) {
    return null;
  }

  const handleDelete = () => {
    setExpanded(false);

    const replyCount = ("replies" in comment && comment.replies?.length) || 0;
    const message = `Deleting this comment will permanently delete this comment${
      replyCount ? ` and its ${replyCount} repl${replyCount == 1 ? "y" : "ies"}` : ""
    }. \n\nAre you sure you want to proceed?`;

    if (window.confirm(message)) {
      if (isRoot) {
        deleteComment(comment.id, recordingId!);
      } else {
        deleteCommentReply(comment.id, recordingId!);
      }
    }
  };
  const editComment = () => {
    setExpanded(false);

    editItem(comment);
  };

  return (
    <div className="comment-actions" onClick={e => e.stopPropagation()}>
      <PortalDropdown
        buttonContent={<DotsHorizontalIcon className="w-5 h-5 opacity-0 group-hover:opacity-100" />}
        setExpanded={setExpanded}
        expanded={expanded}
        buttonStyle=""
        position="bottom-right"
      >
        <div
          className="comments-dropdown-item edit-comment"
          title="Edit Comment"
          onClick={editComment}
        >
          Edit comment
        </div>
        <div
          className="comments-dropdown-item delete-comment"
          title="Delete Comment"
          onClick={handleDelete}
        >
          {isRoot ? "Delete comment and replies" : "Delete comment"}
        </div>
      </PortalDropdown>
    </div>
  );
}

const connector = connect((state: UIState) => ({ recordingId: getRecordingId(state) }), {
  editItem: actions.editItem,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(CommentActions);
