import classNames from "classnames";
import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import { Dropdown, DropdownItem } from "ui/components/Library/LibraryDropdown";
import { useConfirm } from "ui/components/shared/Confirm";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import PortalDropdown from "ui/components/shared/PortalDropdown";
import hooks from "ui/hooks";
import { Comment, Reply } from "ui/state/comments";
import { trackEvent } from "ui/utils/telemetry";

function getDeleteMessage(replyCount: number) {
  if (replyCount > 1) {
    return "Delete comment and replies?";
  }
  if (replyCount === 1) {
    return "Delete comment and reply?";
  }
  return "Delete comment?";
}

function getDeleteDescription(replyCount: number) {
  if (replyCount > 1) {
    return "Deleting this comment will permanently remove it and its replies";
  }
  if (replyCount === 1) {
    return "Deleting this comment will permanently remove it and its reply";
  }
  return "Deleting this comment will permanently remove it";
}

type CommentActionsProps = PropsFromRedux & {
  comment: Comment | Reply;
  isRoot: boolean;
  setIsEditing: (isEditing: boolean) => void;
  setIsUpdating: (value: boolean) => void;
};

function CommentActions({
  comment,
  isRoot,
  setHoveredComment,
  setIsEditing,
  setIsUpdating,
}: CommentActionsProps) {
  const { userId } = hooks.useGetUserId();
  const deleteComment = hooks.useDeleteComment();
  const deleteCommentReply = hooks.useDeleteCommentReply();
  const [expanded, setExpanded] = useState(false);
  const { confirmDestructive } = useConfirm();

  const isCommentAuthor = userId === comment.user.id;

  if (!isCommentAuthor) {
    return null;
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(false);

    const replyCount = ("replies" in comment && comment.replies?.length) || 0;
    const message = getDeleteMessage(replyCount);
    const description = `${getDeleteDescription(replyCount)}. Are you sure you want to proceed?`;

    confirmDestructive({
      acceptLabel: "Delete comment",
      description,
      message,
    }).then(async confirmed => {
      if (!confirmed) {
        return;
      }

      trackEvent("comments.delete");

      setIsUpdating(true);

      if (isRoot) {
        await deleteComment(comment.id);
      } else {
        await deleteCommentReply(comment.id!);
      }

      setIsUpdating(false);
    });

    setHoveredComment(null);
  };
  const editComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(false);
    setIsEditing(true);
    trackEvent("comments.start_edit");
  };

  const button = (
    <MaterialIcon
      outlined
      className={classNames(
        expanded ? "opacity-100" : "",
        "h-4 w-4 text-gray-400 opacity-0 hover:text-primaryAccentHover group-hover:opacity-100"
      )}
    >
      more_vert
    </MaterialIcon>
  );

  return (
    <PortalDropdown
      buttonContent={button}
      setExpanded={setExpanded}
      expanded={expanded}
      buttonStyle=""
      distance={0}
      position="bottom-right"
    >
      <Dropdown>
        <DropdownItem onClick={editComment}>Edit comment</DropdownItem>
        <DropdownItem onClick={handleDelete}>
          {isRoot ? "Delete comment and replies" : "Delete comment"}
        </DropdownItem>
      </Dropdown>
    </PortalDropdown>
  );
}

const connector = connect(null, {
  setHoveredComment: actions.setHoveredComment,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(CommentActions);
