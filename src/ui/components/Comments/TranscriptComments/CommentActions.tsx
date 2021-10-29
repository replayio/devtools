import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import PortalDropdown from "ui/components/shared/PortalDropdown";
import { Comment, Reply } from "ui/state/comments";
import { actions } from "ui/actions";
import hooks from "ui/hooks";
import "./CommentActions.css";
import classNames from "classnames";
import { Dropdown, DropdownItem } from "ui/components/Library/LibraryDropdown";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { trackEvent } from "ui/utils/telemetry";
import { useConfirm } from "ui/components/shared/Confirm";

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
};

function CommentActions({ comment, editItem, isRoot }: CommentActionsProps) {
  const recordingId = hooks.useGetRecordingId();
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
      message,
      description,
      acceptLabel: "Delete comment",
    }).then(confirmed => {
      if (!confirmed) {
        return;
      }

      trackEvent("comments.delete");
      if (isRoot) {
        deleteComment(comment.id, recordingId!);
      } else {
        deleteCommentReply(comment.id, recordingId!);
      }
    });
  };
  const editComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(false);
    trackEvent("comments.start_edit");

    editItem(comment);
  };

  const button = (
    <MaterialIcon
      outlined
      className={classNames(
        expanded ? "opacity-100" : "",
        "h-4 w-4 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-primaryAccentHover"
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
  editItem: actions.editItem,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(CommentActions);
