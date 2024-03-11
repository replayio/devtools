import { SerializedEditorState } from "lexical";
import { MouseEventHandler, useState } from "react";

import CommentEditor from "replay-next/components/lexical/CommentEditor";
import { useNag } from "replay-next/src/hooks/useNag";
import { Nag, Remark } from "shared/graphql/types";
import useCommentContextMenu from "ui/components/Comments/useCommentContextMenu";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { useUpdateComment, useUpdateCommentReply } from "ui/hooks/comments/comments";
import useDeleteComment from "ui/hooks/comments/useDeleteComment";
import useDeleteCommentReply from "ui/hooks/comments/useDeleteCommentReply";
import useRecordingUsers from "ui/hooks/useGetCollaboratorNames";
import { useGetUserId } from "ui/hooks/users";
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

  const startEditing = () => {
    setIsEditing(true);
  };

  const discardPendingChanges = () => {
    setIsEditing(false);
  };

  const [, dismissAddCommentNag] = useNag(Nag.ADD_COMMENT);

  const saveChanges = async (editorState: SerializedEditorState) => {
    setIsPending(true);
    setIsEditing(false);

    const string = JSON.stringify(editorState);

    if (type === "comment") {
      await updateComment(remarkId, string, true);
    } else {
      await updateCommentReply(remarkId, string, true);
    }

    dismissAddCommentNag();
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
    saveRemark: saveChanges,
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

        <button
          className={styles.ContextMenuButton}
          data-test-name="ContextMenuButton"
          onClick={onContextMenuClick}
        >
          <MaterialIcon className={styles.Icon} disabled={isPending} outlined>
            more_vert
          </MaterialIcon>
        </button>
      </div>

      <div className={classNames.join(" ")} onDoubleClick={onDoubleClick}>
        <CommentEditor
          autoFocus={isEditing}
          collaborators={collaborators}
          dataTestId={remark.id ? `CommentInput-${remark.id}` : undefined}
          dataTestName="CommentInput"
          editable={isEditing && !isPending}
          initialValue={content}
          onCancel={discardPendingChanges}
          onDelete={deleteRemark}
          onSave={saveChanges}
          placeholder={type === "reply" ? "Write a reply..." : "Type a comment"}
        />
      </div>

      {contextMenu}
    </>
  );
}
