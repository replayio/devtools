import { ReactNode, useMemo, useState } from "react";
import { useUpdateComment, useUpdateCommentReply } from "ui/hooks/comments/comments";
import useDeleteComment from "ui/hooks/comments/useDeleteComment";
import useDeleteCommentReply from "ui/hooks/comments/useDeleteCommentReply";
import { useGetOwnersAndCollaborators, useGetRecordingId } from "ui/hooks/recordings";
import { useGetUserId } from "ui/hooks/users";
import { setModal } from "ui/reducers/app";
import { useAppDispatch } from "ui/setup/hooks";
import type { Comment, Remark } from "ui/state/comments";
import { User } from "ui/types";
import { formatRelativeTime } from "ui/utils/comments";

import { AvatarImage } from "../Avatar";

import TipTapEditor from "./CommentEditor/TipTapEditor";
import styles from "./EditableRemark.module.css";
import { FocusContext } from "./FocusContext";
import LoomComment from "./LoomComment";
import RemarkDropDown from "./RemarkDropDown";

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

  const users = useCollaborators();

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
    saveChanges(content);
  };

  const discardPendingChanges = () => {
    setIsEditing(false);
  };

  const saveChanges = async (newContent: string) => {
    setIsPending(true);
    setIsEditing(false);

    if (type === "comment") {
      await updateComment(remarkId, newContent, true, (remark as Comment).position);
    } else {
      await updateCommentReply(remarkId, newContent, true);
    }

    setIsPending(false);
  };

  const onDoubleClick = () => {
    if (canEdit) {
      startEditing();
    }
  };

  const loomUrl = content.match(/loom\.com\/share\/(\S*?)(\"|\?)/)?.[1];

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
        {loomUrl && !isEditing ? (
          <LoomComment loomUrl={loomUrl} />
        ) : (
          <FocusContext.Consumer>
            {({ autofocus, blur, close, isFocused }) => (
              <TipTapEditor
                autofocus={autofocus}
                blur={blur}
                close={close}
                content={content}
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
        )}
      </div>
    </>
  );
}

function useCollaborators() {
  const recordingId = useGetRecordingId();
  const { collaborators, owner } = useGetOwnersAndCollaborators(recordingId!);

  const users = useMemo(
    () =>
      collaborators && owner
        ? ([...collaborators.map(c => c.user), owner].filter(Boolean) as User[])
        : undefined,
    [collaborators, owner]
  );

  return users;
}
