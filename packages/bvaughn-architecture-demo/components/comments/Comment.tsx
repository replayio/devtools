import { SerializedEditorState } from "lexical";
import React, {
  ReactNode,
  unstable_useCacheRefresh as useCacheRefresh,
  useContext,
  useState,
  useTransition,
} from "react";

import AvatarImage from "bvaughn-architecture-demo/components/AvatarImage";
import Icon from "bvaughn-architecture-demo/components/Icon";
import CommentEditor from "bvaughn-architecture-demo/components/lexical/CommentEditor";
import { GraphQLClientContext } from "bvaughn-architecture-demo/src/contexts/GraphQLClientContext";
import { SessionContext } from "bvaughn-architecture-demo/src/contexts/SessionContext";
import {
  addCommentReply as addCommentReplyGraphQL,
  deleteComment as deleteCommentGraphQL,
  deleteCommentReply as deleteCommentReplyGraphQL,
  updateComment as updateCommentGraphQL,
  updateCommentReply as updateCommentReplyGraphQL,
} from "bvaughn-architecture-demo/src/graphql/Comments";
import { Comment, User } from "bvaughn-architecture-demo/src/graphql/types";
import { formatRelativeTime } from "bvaughn-architecture-demo/src/utils/time";

import styles from "./Comment.module.css";

export default function CommentRenderer({ comment }: { comment: Comment }) {
  const { accessToken } = useContext(SessionContext);
  const graphQLClient = useContext(GraphQLClientContext);

  const invalidateCache = useCacheRefresh();
  const [isPending, startTransition] = useTransition();

  const addReplyTransition = () => {
    startTransition(async () => {
      await addCommentReplyGraphQL(graphQLClient, accessToken!, comment.id, "", false);

      invalidateCache();
    });
  };

  const deleteCommentCallback = async () => {
    await deleteCommentGraphQL(graphQLClient, accessToken as string, comment.id);
  };

  const editCommentCallback = async (content: string, isPublished: boolean) => {
    await updateCommentGraphQL(
      graphQLClient,
      accessToken!,
      comment.id,
      content,
      isPublished,
      comment.position
    );
  };

  return (
    <EditableRemark
      key={comment.id}
      className={comment.isPublished ? styles.PublishedComment : styles.UnpublishedComment}
      content={comment.content}
      createdAt={comment.createdAt}
      deleteCallback={deleteCommentCallback}
      editCallback={editCommentCallback}
      isPublished={comment.isPublished}
      owner={comment.user}
    >
      {comment.replies.map(reply => {
        const deleteCommentReplyCallback = async () => {
          await deleteCommentReplyGraphQL(graphQLClient, accessToken as string, reply.id);
        };

        const editCommentReplyCallback = async (content: string, isPublished: boolean) => {
          await updateCommentReplyGraphQL(
            graphQLClient,
            accessToken!,
            reply.id,
            content,
            isPublished
          );
        };

        return (
          <EditableRemark
            key={reply.id}
            className={reply.isPublished ? styles.PublishedReply : styles.UnpublishedReply}
            content={reply.content}
            createdAt={reply.createdAt}
            deleteCallback={deleteCommentReplyCallback}
            editCallback={editCommentReplyCallback}
            isPublished={reply.isPublished}
            owner={reply.user}
          />
        );
      })}

      {accessToken !== null && (
        <button className={styles.ReplyButton} disabled={isPending} onClick={addReplyTransition}>
          Reply
        </button>
      )}
    </EditableRemark>
  );
}

function EditableRemark({
  children,
  className,
  content,
  createdAt,
  deleteCallback,
  editCallback,
  isPublished,
  owner,
}: {
  children?: ReactNode;
  className: string;
  content: string;
  createdAt: string;
  deleteCallback: () => Promise<void>;
  editCallback: (newContent: string, newIsPublished: boolean) => Promise<void>;
  isPublished: boolean;
  owner: User;
}) {
  const { currentUserInfo } = useContext(SessionContext);
  const invalidateCache = useCacheRefresh();

  const [isEditing, setIsEditing] = useState(content === "");

  // Editing or deleting this content is a self-contained transition.
  const [isPending, startTransition] = useTransition();

  const deleteTransition = () => {
    startTransition(async () => {
      await deleteCallback();

      invalidateCache();
    });
  };

  const startEditing = () => {
    setIsEditing(true);
  };

  const save = (newContent: string, newIsPublished: boolean = isPublished) => {
    setIsEditing(false);

    startTransition(async () => {
      await editCallback(newContent, newIsPublished === true);

      invalidateCache();
    });
  };

  const onCancel = () => {
    setIsEditing(false);
  };

  const onDelete = () => {
    deleteTransition();
  };

  const onSave = (editorState: SerializedEditorState) => {
    save(JSON.stringify(editorState), false);
  };

  return (
    <div className={className}>
      <div className={styles.HeaderRow}>
        <AvatarImage className={styles.Avatar} src={owner.picture} />
        <div className={styles.UserName} title={owner.name}>
          {owner.name}
        </div>
        <div className={styles.Time}>{formatRelativeTime(new Date(createdAt))}</div>
        {currentUserInfo?.id === owner.id && (
          <>
            <button
              className={styles.Button}
              disabled={isEditing || isPending}
              onClick={startEditing}
              title="Edit"
            >
              <Icon className={styles.Icon} type="edit" />
            </button>

            <DeleteWithConfirmationButton deleteCallback={deleteTransition} disabled={isPending} />

            <button
              className={styles.Button}
              disabled={isPending}
              onClick={() => save(content, !isPublished)}
              title={isPublished ? "Make private" : "Publish"}
            >
              <Icon className={styles.Icon} type={isPublished ? "visible" : "invisible"} />
            </button>
          </>
        )}
      </div>

      <div className={styles.ContentWrapper} onDoubleClick={startEditing}>
        <CommentEditor
          autoFocus={isEditing}
          editable={isEditing && !isPending}
          initialValue={content}
          onCancel={onCancel}
          onDelete={onDelete}
          onSave={onSave}
          placeholder="Leave a comment"
        />
      </div>

      {children}
    </div>
  );
}

function DeleteWithConfirmationButton({
  deleteCallback,
  disabled,
}: {
  deleteCallback: () => void;
  disabled: boolean;
}) {
  const [isActive, setIsActive] = useState(false);

  if (isActive) {
    const cancel = () => setIsActive(false);
    const confirm = () => {
      setIsActive(true);
      deleteCallback();
    };

    return (
      <>
        <button className={styles.Button} disabled={disabled} onClick={cancel} title="Cancel">
          <Icon className={styles.Icon} type="cancel" />
        </button>
        <button
          className={`${styles.Button} ${styles.ConfirmDeleteButton}`}
          disabled={disabled}
          onClick={confirm}
          title="Confirm delete"
        >
          <Icon className={styles.Icon} type="confirm" />
        </button>
      </>
    );
  } else {
    return (
      <button
        className={styles.Button}
        disabled={disabled}
        onClick={() => setIsActive(true)}
        title="?"
      >
        <Icon className={styles.Icon} type="delete" />
      </button>
    );
  }
}
