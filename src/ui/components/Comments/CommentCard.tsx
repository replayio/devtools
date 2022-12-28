import classNames from "classnames";
import { MouseEvent } from "react";

import { getExecutionPoint } from "devtools/client/debugger/src/selectors";
import { seekToComment } from "ui/actions/comments";
import { getViewMode } from "ui/reducers/layout";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { Comment } from "ui/state/comments";
import { isCommentContentEmpty } from "ui/utils/comments";

import CommentPreview from "./CommentPreview";
import CommentReplyButton from "./CommentReplyButton";
import EditableRemark from "./EditableRemark";
import ReplyCard from "./ReplyCard";
import styles from "./CommentCard.module.css";

export default function CommentCard({ comment }: { comment: Comment }) {
  const currentTime = useAppSelector(getCurrentTime);
  const executionPoint = useAppSelector(getExecutionPoint);
  const viewMode = useAppSelector(getViewMode);
  const isPaused = currentTime === comment.time && executionPoint === comment.point;

  const dispatch = useAppDispatch();

  const onClick = (event: MouseEvent) => {
    event.stopPropagation();
    const openSource = viewMode === "dev";
    dispatch(seekToComment(comment, comment.sourceLocation, openSource));
  };

  const onPreviewClick = (event: MouseEvent) => {
    event.stopPropagation();
    dispatch(seekToComment(comment, comment.sourceLocation, true));
  };

  const showReplyButton = !isCommentContentEmpty(comment.content);

  return (
    <div
      className={classNames(styles.CommentCard, !comment.isPublished && styles.Unpublished)}
      onClick={onClick}
    >
      {isPaused && <div className={styles.PausedOverlay} />}

      <CommentPreview comment={comment} onClick={onPreviewClick} />

      <EditableRemark remark={comment} type="comment" />

      {comment.replies.map(reply => (
        <ReplyCard key={reply.id} reply={reply} />
      ))}

      {showReplyButton && <CommentReplyButton comment={comment} />}
    </div>
  );
}
