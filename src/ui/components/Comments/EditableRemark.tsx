import { SerializedEditorState } from "lexical";
import { MouseEventHandler, useState } from "react";

import CommentEditor from "replay-next/components/lexical/CommentEditor";
import { useNag } from "replay-next/src/hooks/useNag";
import { Nag } from "shared/graphql/types";
import useCommentContextMenu from "ui/components/Comments/useCommentContextMenu";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { useUpdateComment, useUpdateCommentReply } from "ui/hooks/comments/comments";
import useDeleteComment from "ui/hooks/comments/useDeleteComment";
import useDeleteCommentReply from "ui/hooks/comments/useDeleteCommentReply";
import useRecordingUsers from "ui/hooks/useGetCollaboratorNames";
import { useGetUserId } from "ui/hooks/users";
import type { Comment, Remark } from "ui/state/comments";
import { formatRelativeTime } from "ui/utils/comments";

import { AvatarImage } from "../Avatar";
import styles from "./EditableRemark.module.css";

export default function EditableRemark({
  remark,
  type,
}: {
  remark: Remark;
  type: "comment" | "reply";
}) {
  const { content, id: remarkId, user } = remark;

  const { userId } = useGetUserId();

  const canEdit = user?.id === userId;

  const deleteComment = useDeleteComment();
  const deleteCommentReply = useDeleteCommentReply();
  const updateComment = useUpdateComment();
  const updateCommentReply = useUpdateCommentReply();

  const collaborators = useRecordingUsers(true);

  // This should be replaced with useTransition() once we're using Suspense for comment data.
  const [isPending, setIsPending] = useState(false);

  // New comments should default to showing edit mode.
  const [isEditing, setIsEditing] = useState(canEdit && content === "");

  const showOptionsMenu = !isEditing && !isPending && canEdit;

  const startEditing = () => {
    setIsEditing(true);
  };

  const discardPendingChanges = () => {
    setIsEditing(false);
  };

  const handleSaveChanges = (editorState: SerializedEditorState) => {
    saveChanges(editorState);
    dismissAddCommentNag();
  };

  const [addCommentState, dismissAddCommentNag] = useNag(Nag.ADD_COMMENT);

  const saveChanges = async (editorState: SerializedEditorState) => {
    setIsPending(true);
    setIsEditing(false);

    const string = JSON.stringify(editorState);

    if (type === "comment") {
      await updateComment(remarkId, string, true, (remark as Comment).position);
    } else {
      await updateCommentReply(remarkId, string, true);
    }

    setIsPending(false);
  };

  const deleteRemark = async () => {
    setIsPending(true);

    if (type === "comment") {
      await deleteComment(remark.id);
    } else {
      await deleteCommentReply(remark.id);
    }

    setIsPending(false);
  };

  const onDoubleClick = () => {
    if (canEdit) {
      startEditing();
    }
  };

  const classNames = [styles.Content];
  if (!remark.isPublished) {
    classNames.push(styles.Unpublished);
  }
  if (isEditing) {
    classNames.push(styles.Editing);
  }

  const onContextMenuClick: MouseEventHandler = event => {
    event.stopPropagation();

    onContextMenu(event);
  };

  const { contextMenu, onContextMenu } = useCommentContextMenu({
    deleteRemark: deleteRemark,
    editRemark: startEditing,
    remark: remark,
    saveRemark: handleSaveChanges,
    type: type,
  });

  return (
    <>
      <div className={styles.HeaderRow}>
        <AvatarImage className={styles.Avatar} src={user?.picture} />
        <div className={styles.UserName} title={user?.name || undefined}>
          {user?.name}
        </div>
        <div className={styles.Time}>{formatRelativeTime(new Date(remark.createdAt))}</div>

        <MaterialIcon
          className={styles.Icon}
          disabled={isPending}
          outlined
          onClick={onContextMenuClick}
        >
          more_vert
        </MaterialIcon>
      </div>

      <div className={classNames.join(" ")} onDoubleClick={onDoubleClick}>
        <CommentEditor
          autoFocus={isEditing}
          collaborators={collaborators}
          editable={isEditing && !isPending}
          initialValue={content}
          onCancel={discardPendingChanges}
          onDelete={deleteRemark}
          onSave={handleSaveChanges} // Replace 'saveChanges' with 'handleSaveChanges'
          placeholder={type === "reply" ? "Write a reply..." : "Type a comment"}
        />
      </div>

      {contextMenu}
    </>
  );
}
