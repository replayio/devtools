import { useMemo, useState } from "react";
import { useUpdateComment, useUpdateCommentReply } from "ui/hooks/comments/comments";
import useDeleteComment from "ui/hooks/comments/useDeleteComment";
import useDeleteCommentReply from "ui/hooks/comments/useDeleteCommentReply";
import { useGetOwnersAndCollaborators, useGetRecordingId } from "ui/hooks/recordings";
import { useGetUserId } from "ui/hooks/users";
import type { Comment, Remark } from "ui/state/comments";
import { User } from "ui/types";
import { formatRelativeTime } from "ui/utils/comments";

import { AvatarImage } from "../Avatar";

import TipTapEditor from "./CommentEditor/TipTapEditor";
import styles from "./EditableRemark.module.css";
import { FocusContext } from "./FocusContext";
import RemarkDropDown from "./RemarkDropDown";

export default function EditableRemark({
  remark,
  type,
}: {
  remark: Remark;
  type: "comment" | "reply";
}) {
  const { userId } = useGetUserId();

  const canEdit = remark.user.id === userId;

  const deleteComment = useDeleteComment();
  const deleteCommentReply = useDeleteCommentReply();
  const updateComment = useUpdateComment();
  const updateCommentReply = useUpdateCommentReply();

  const users = useCollaborators();

  // This should be replaced with useTransition() once we're using Suspense for comment data.
  const [isPending, setIsPending] = useState(false);

  // New comments should default to showing edit mode.
  const [isEditing, setIsEditing] = useState(canEdit && remark.content === "");

  const showOptionsMenu = !isEditing && !isPending && canEdit;

  const startEditing = () => {
    setIsEditing(true);
  };

  const deleteRemark = async () => {
    if (type === "comment") {
      await deleteComment(remark.id);
    } else {
      await deleteCommentReply(remark.id);
    }
  };

  const publishRemark = () => {
    saveChanges(remark.content);
  };

  const discardPendingChanges = () => {
    setIsEditing(false);
  };

  const saveChanges = async (newContent: string) => {
    setIsPending(true);
    setIsEditing(false);

    if (type === "comment") {
      await updateComment(remark.id, newContent, true, (remark as Comment).position);
    } else {
      await updateCommentReply(remark.id, newContent, true);
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
        <AvatarImage className={styles.Avatar} src={remark.user.picture} />
        <div className={styles.UserName} title={remark.user.name}>
          {remark.user.name}
        </div>
        <div className={styles.Time}>{formatRelativeTime(new Date(remark.createdAt))}</div>
        {showOptionsMenu && (
          <RemarkDropDown
            deleteRemark={deleteRemark}
            isPublished={remark.isPublished}
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
        <FocusContext.Consumer>
          {({ autofocus, blur, close, isFocused }) => (
            <TipTapEditor
              autofocus={autofocus}
              blur={blur}
              close={close}
              content={remark.content}
              editable={isEditing && !isPending}
              handleCancel={discardPendingChanges}
              handleDelete={deleteRemark}
              handleSubmit={saveChanges}
              possibleMentions={users || []}
              placeholder={type === "reply" ? "Write a reply..." : "Type a comment"}
              takeFocus={isFocused}
            />
          )}
        </FocusContext.Consumer>
      </div>
    </>
  );
}

function useCollaborators() {
  const recordingId = useGetRecordingId();
  const { collaborators, recording } = useGetOwnersAndCollaborators(recordingId!);

  const users = useMemo(
    () =>
      collaborators && recording
        ? ([...collaborators.map(c => c.user), recording.user].filter(Boolean) as User[])
        : undefined,
    [collaborators, recording]
  );

  return users;
}
