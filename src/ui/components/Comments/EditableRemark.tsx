import { useMemo, useRef, useState } from "react";
import { useUpdateComment, useUpdateCommentReply } from "ui/hooks/comments/comments";
import useDeleteComment from "ui/hooks/comments/useDeleteComment";
import useDeleteCommentReply from "ui/hooks/comments/useDeleteCommentReply";
import { useGetOwnersAndCollaborators, useGetRecordingId } from "ui/hooks/recordings";
import { useGetUserId } from "ui/hooks/users";
import type { Comment, Remark } from "ui/state/comments";
import { User } from "ui/types";
import { formatRelativeTime } from "ui/utils/comments";

import MaterialIcon from "../shared/MaterialIcon";

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
  const [pendingContent, setPendingContent] = useState(remark.content);

  // Both the Enter key and "blur" trigger saving behavior.
  // This ref ensures that only the first event to occur gets handled.
  const saveOnBlurRef = useRef(true);

  const showOptionsMenu = !isEditing && !isPending && canEdit;

  const startEditing = () => {
    saveOnBlurRef.current = true;
    setPendingContent(remark.content);
    setIsEditing(true);
  };

  const deleteRemark = async () => {
    if (type === "comment") {
      await deleteComment(remark.id);
    } else {
      await deleteCommentReply(remark.id);
    }
  };

  const discardPendingContent = () => {
    saveOnBlurRef.current = false;

    if (remark.content.trim() === "") {
      deleteRemark();
    }

    setPendingContent("");
    setIsEditing(false);
  };

  const publishRemark = () => {
    saveRemark(remark.content, true);
  };

  const saveRemark = async (newContent: string, newIsPublished: boolean = remark.isPublished) => {
    setIsPending(true);
    setPendingContent("");
    setIsEditing(false);

    if (type === "comment") {
      await updateComment(remark.id, newContent, newIsPublished, (remark as Comment).position);
    } else {
      await updateCommentReply(remark.id, newContent, newIsPublished);
    }

    setIsPending(false);
  };

  const onBlur = () => {
    if (saveOnBlurRef.current) {
      if (pendingContent.trim() === "") {
        deleteRemark();
      } else {
        saveRemark(pendingContent);
      }
    }
  };

  const onChange = (event: React.ChangeEvent) => {
    setPendingContent((event.currentTarget as HTMLTextAreaElement).value);
  };

  const onDoubleClick = () => {
    if (canEdit) {
      startEditing();
    }
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "Enter": {
        event.preventDefault();
        saveOnBlurRef.current = false;
        saveRemark(pendingContent, true);
        break;
      }
      case "Escape": {
        event.preventDefault();
        discardPendingContent();
        break;
      }
    }
  };

  // TODO Double click starts edit

  return (
    <>
      <div className={styles.HeaderRow}>
        <img className={styles.Avatar} src={remark.user.picture} />
        <div className={styles.UserName} title={remark.user.name}>
          {remark.user.name}
        </div>
        <div className={styles.Time}>{formatRelativeTime(new Date(remark.createdAt))}</div>
        {!remark.isPublished && (
          <MaterialIcon
            className={styles.UnpublishedIcon}
            title="This comment has not been published"
          >
            lock
          </MaterialIcon>
        )}
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
              key={remark.id}
              autofocus={autofocus}
              blur={blur}
              close={close}
              content={pendingContent}
              editable={isEditing && !isPending}
              handleCancel={discardPendingContent}
              handleSubmit={saveRemark}
              possibleMentions={users || []}
              placeholder={
                remark.content == ""
                  ? type === "reply"
                    ? "Write a reply..."
                    : "Type a comment"
                  : ""
              }
              takeFocus={isFocused}
              onCreate={noop}
              onUpdate={noop}
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

function noop() {}
