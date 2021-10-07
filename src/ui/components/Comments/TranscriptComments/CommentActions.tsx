import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import PortalDropdown from "ui/components/shared/PortalDropdown";
import { Comment, Reply } from "ui/state/comments";
import { actions } from "ui/actions";
import hooks from "ui/hooks";
import "./CommentActions.css";
import { DotsHorizontalIcon } from "@heroicons/react/solid";

type CommentActionsProps = PropsFromRedux & {
  comment: Comment | Reply;
  isRoot: boolean;
};

function CommentActions({ comment, editItem, isRoot }: CommentActionsProps) {
  const recordingId = hooks.useGetRecordingId();
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
        buttonContent={
          <div className="text-gray-400">
            <DotsHorizontalIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
          </div>
        }
        setExpanded={setExpanded}
        expanded={expanded}
        buttonStyle=""
        position="bottom-right"
      >
        <div className="old-portal">
          <div
            className="comments-dropdown-item edit-comment text-xs"
            title="Edit Comment"
            onClick={editComment}
          >
            Edit comment
          </div>
          <div
            className="comments-dropdown-item delete-comment text-xs"
            title="Delete Comment"
            onClick={handleDelete}
          >
            {isRoot ? "Delete comment and replies" : "Delete comment"}
          </div>
        </div>
      </PortalDropdown>
    </div>
  );
}

const connector = connect(null, {
  editItem: actions.editItem,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(CommentActions);
