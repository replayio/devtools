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
import { SourcesContext } from "bvaughn-architecture-demo/src/contexts/SourcesContext";
import {
  addCommentReply as addCommentReplyGraphQL,
  deleteComment as deleteCommentGraphQL,
  deleteCommentReply as deleteCommentReplyGraphQL,
  updateComment as updateCommentGraphQL,
  updateCommentReply as updateCommentReplyGraphQL,
} from "bvaughn-architecture-demo/src/graphql/Comments";
import { Comment, CommentSourceLocation, User } from "bvaughn-architecture-demo/src/graphql/types";
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
      networkRequestId={comment.networkRequestId}
      owner={comment.user}
      primaryLabel={comment.primaryLabel || null}
      secondaryLabel={comment.secondaryLabel || null}
      sourceLocation={comment.sourceLocation}
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
            networkRequestId={null}
            owner={reply.user}
            primaryLabel={null}
            secondaryLabel={null}
            sourceLocation={null}
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
  networkRequestId,
  owner,
  primaryLabel,
  secondaryLabel,
  sourceLocation,
}: {
  children?: ReactNode;
  className: string;
  content: string;
  createdAt: string;
  deleteCallback: () => Promise<void>;
  editCallback: (newContent: string, newIsPublished: boolean) => Promise<void>;
  isPublished: boolean;
  networkRequestId: string | null;
  owner: User;
  primaryLabel: string | null;
  secondaryLabel: string | null;
  sourceLocation: CommentSourceLocation | null;
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

      <CommentPreview
        networkRequestId={networkRequestId}
        primaryLabel={primaryLabel}
        secondaryLabel={secondaryLabel}
        sourceLocation={sourceLocation}
      />

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

function CommentPreview({
  networkRequestId,
  primaryLabel,
  secondaryLabel,
  sourceLocation,
}: {
  networkRequestId: string | null;
  primaryLabel: string | null;
  secondaryLabel: string | null;
  sourceLocation: CommentSourceLocation | null;
}) {
  const { openSource } = useContext(SourcesContext);

  if (primaryLabel === null && secondaryLabel === null) {
    return null;
  }

  if (sourceLocation !== null || networkRequestId !== null) {
    const onClick = () => {
      if (sourceLocation) {
        const { line: lineNumber, sourceId } = sourceLocation;

        const lineIndex = lineNumber - 1;

        openSource("view-source", sourceId, lineIndex, lineIndex);
      }
    };

    return (
      <div className={styles.Labels} onClick={onClick}>
        {primaryLabel && <div className={styles.PrimaryLabel}>{primaryLabel}</div>}
        {secondaryLabel && (
          <div
            className={styles.SecondaryLabel}
            dangerouslySetInnerHTML={{ __html: secondaryLabel }}
          />
        )}
      </div>
    );
  } else if (typeof secondaryLabel === "string" && secondaryLabel.startsWith("data:image")) {
    let indicatorLeft: string | null = null;
    let indicatorTop: string | null = null;
    if (typeof primaryLabel === "string") {
      try {
        const coordinates = JSON.parse(primaryLabel);
        indicatorLeft = `${coordinates.x * 100}%`;
        indicatorTop = `${coordinates.y * 100}%`;
      } catch (error) {}
    }

    return (
      <div className={styles.OuterImageContainer}>
        <div className={styles.InnerImageContainer}>
          <img className={styles.Image} src={secondaryLabel} />

          {indicatorLeft !== null && indicatorTop !== null && (
            <Icon
              className={styles.PositionIndicator}
              style={{ left: indicatorLeft, top: indicatorTop }}
              type="comment"
            />
          )}
        </div>
      </div>
    );
  }

  return null;
}
