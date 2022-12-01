import { SerializedEditorState } from "lexical";
import { useMemo, useState } from "react";

import CommentEditor from "bvaughn-architecture-demo/components/lexical/CommentEditor";
import { useUpdateComment, useUpdateCommentReply } from "ui/hooks/comments/comments";
import useDeleteComment from "ui/hooks/comments/useDeleteComment";
import useDeleteCommentReply from "ui/hooks/comments/useDeleteCommentReply";
import { useGetOwnersAndCollaborators, useGetRecordingId } from "ui/hooks/recordings";
import { useGetUserId } from "ui/hooks/users";
import type { Comment, Remark } from "ui/state/comments";
import { formatRelativeTime } from "ui/utils/comments";

import { AvatarImage } from "../Avatar";
import RemarkDropDown from "./RemarkDropDown";
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

  const recordingId = useGetRecordingId();
  const ownersAndCollaborators = useGetOwnersAndCollaborators(recordingId);
  const collaboratorNames = useMemo(() => {
    const names: string[] = [];
    if (ownersAndCollaborators.collaborators) {
      ownersAndCollaborators.collaborators.forEach(collaborator => {
        if (collaborator?.user?.name) {
          names.push(collaborator.user.name);
        }
      });
    }
    return names;
  }, [ownersAndCollaborators]);

  // This should be replaced with useTransition() once we're using Suspense for comment data.
  const [isPending, setIsPending] = useState(false);

  // New comments should default to showing edit mode.
  const [isEditing, setIsEditing] = useState(canEdit && content === "");

  const showOptionsMenu = !isEditing && !isPending && canEdit;

  const startEditing = () => {
    setIsEditing(true);
  };

  const deleteRemark = async () => {
    if (type === "comment") {
      await deleteComment(remarkId);
    } else {
      await deleteCommentReply(remarkId);
    }
  };

  const publishRemark = () => {
    saveChanges(JSON.parse(content));
  };

  const discardPendingChanges = () => {
    setIsEditing(false);
  };

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

  const onDoubleClick = () => {
    if (canEdit) {
      startEditing();
    }
  };

  return (
    <>
      <div className={styles.HeaderRow}>
        <AvatarImage className={styles.Avatar} src={user?.picture} />
        <div className={styles.UserName} title={user?.name || undefined}>
          {user?.name}
        </div>
        <div className={styles.Time}>{formatRelativeTime(new Date(remark.createdAt))}</div>
        {showOptionsMenu && (
          <RemarkDropDown
            deleteRemark={deleteRemark}
            isPublished={!!remark.isPublished}
            publishRemark={publishRemark}
            startEditing={startEditing}
            type={type}
          />
        )}
      </div>

      <div
        className={remark.isPublished ? styles.PublishedContent : styles.UnpublishedContent}
        onDoubleClick={onDoubleClick}
      >
        <CommentEditor
          autoFocus={isEditing}
          collaboratorNames={collaboratorNames}
          editable={isEditing && !isPending}
          initialValue={content}
          onCancel={discardPendingChanges}
          onDelete={deleteRemark}
          onSave={saveChanges}
          placeholder={type === "reply" ? "Write a reply..." : "Type a comment"}
        />
      </div>
    </>
  );
}
