import classNames from "classnames";
import { MouseEvent, memo, useContext } from "react";

import { selectLocation } from "devtools/client/debugger/src/actions/sources";
import { getThreadContext } from "devtools/client/debugger/src/selectors";
import {
  isSourceCodeComment,
  isSourceCodeCommentTypeData,
} from "replay-next/components/sources/utils/comments";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { Comment } from "shared/graphql/types";
import { isPointInRegion } from "shared/utils/time";
import { seekToComment } from "ui/actions/comments";
import { setViewMode } from "ui/actions/layout";
import useUserCommentPreferences from "ui/components/Comments/useUserCommentPreferences";
import {
  getHoveredCommentId,
  getSelectedCommentId,
  setHoveredCommentId,
  setSelectedCommentId,
} from "ui/reducers/app";
import { getViewMode } from "ui/reducers/layout";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { isCommentContentEmpty } from "ui/utils/comments";
import { trackEvent } from "ui/utils/telemetry";

import CommentPreview from "./CommentPreview";
import CommentReplyButton from "./CommentReplyButton";
import EditableRemark from "./EditableRemark";
import ReplyCard from "./ReplyCard";
import styles from "./CommentCard.module.css";

export type PauseOverlayPosition = "after" | "before";

function CommentCard({
  comment,
  pauseOverlayPosition,
  pauseOverlayTime,
}: {
  comment: Comment;
  pauseOverlayPosition: PauseOverlayPosition | null;
  pauseOverlayTime: number | null;
}) {
  const { range: focusRange } = useContext(FocusContext);
  const { currentUserInfo } = useContext(SessionContext);

  const viewMode = useAppSelector(getViewMode);
  const hoveredCommentId = useAppSelector(getHoveredCommentId);
  const selectedCommentId = useAppSelector(getSelectedCommentId);

  const context = useAppSelector(getThreadContext);
  const dispatch = useAppDispatch();

  const { filter, showPreview } = useUserCommentPreferences();

  const onClick = (event: MouseEvent) => {
    event.stopPropagation();

    dispatch(setSelectedCommentId(comment.id));

    const openSource = viewMode === "dev";
    if (isSourceCodeComment(comment)) {
      dispatch(seekToComment(comment, openSource));
    }

    const { type, typeData } = comment;
    if (openSource && isSourceCodeCommentTypeData(type, typeData)) {
      dispatch(setViewMode("dev"));
      trackEvent("comments.select_location");

      dispatch(
        selectLocation(context, {
          column: typeData.columnIndex,
          line: typeData.lineNumber,
          sourceId: typeData.sourceId,
          sourceUrl: typeData.sourceUrl || undefined,
        })
      );
    }
  };

  const onMouseEnter = () => {
    dispatch(setHoveredCommentId(comment.id));
  };

  const onMouseLeave = () => {
    dispatch(setHoveredCommentId(null));
  };

  const onPreviewClick = (event: MouseEvent) => {
    event.stopPropagation();
    dispatch(seekToComment(comment, true));
  };

  const showReplyButton = !isCommentContentEmpty(comment.content);

  let replies = comment.replies;
  if (filter === "current-user") {
    replies = replies.filter(reply => reply.user?.id === currentUserInfo?.id);
  }

  const isFocused = focusRange == null || isPointInRegion(comment.point, focusRange);

  let isHighlighted = false;
  if (comment.time === pauseOverlayTime) {
    isHighlighted = hoveredCommentId === comment.id || selectedCommentId === comment.id;
  }

  return (
    <div
      className={classNames(
        styles.CommentCard,
        !comment.isPublished && styles.Unpublished,
        isFocused || styles.UnfocusedDimmed
      )}
      data-highlighted={isHighlighted || undefined}
      data-test-comment-id={comment.id}
      data-test-comment-type={comment.type}
      data-test-id={`CommentCard-${comment.id}`}
      data-test-name="CommentCard"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {pauseOverlayPosition !== null && (
        <div className={styles.PausedOverlay} data-position={pauseOverlayPosition} />
      )}

      {showPreview && <CommentPreview comment={comment} onClick={onPreviewClick} />}

      <EditableRemark remark={comment} type="comment" />

      {replies.map(reply => (
        <ReplyCard key={reply.id} reply={reply} />
      ))}

      {showReplyButton && <CommentReplyButton comment={comment} />}
    </div>
  );
}

const MemoizedCommentCard = memo(CommentCard);
export default MemoizedCommentCard;
