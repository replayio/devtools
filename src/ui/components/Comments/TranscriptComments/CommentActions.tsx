import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import PortalDropdown from "ui/components/shared/PortalDropdown";
import { Comment } from "ui/state/comments";
import { actions } from "ui/actions";
import hooks from "ui/hooks";
import useToken from "ui/utils/useToken";
import "./CommentActions.css";

type CommentActionsProps = PropsFromRedux & {
  comment: Comment;
  isRoot: boolean;
};

function CommentActions({ comment, editItem, isRoot }: CommentActionsProps) {
  const { claims } = useToken();
  const userId = claims?.hasura.userId;
  const deleteComment = hooks.useDeleteComment();
  const deleteCommentReplies = hooks.useDeleteCommentReplies();
  const [expanded, setExpanded] = useState(false);

  const isCommentAuthor = userId === comment.user.id;

  if (!isCommentAuthor) {
    return null;
  }

  const handleDelete = () => {
    deleteComment({ variables: { commentId: comment.id } });

    if (isRoot) {
      deleteCommentReplies({ variables: { parentId: comment.id } });
    }
  };
  const editComment = () => {
    editItem(comment);
  };

  return (
    <div className="comment-actions" onClick={e => e.stopPropagation()}>
      <PortalDropdown
        buttonContent={<div className="dropdown-button">⋮</div>}
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

const connector = connect(null, {
  editItem: actions.editItem,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(CommentActions);
