import classNames from "classnames";
import { MouseEvent, memo, useContext } from "react";

import { selectLocation } from "devtools/client/debugger/src/actions/sources";
import { getThreadContext } from "devtools/client/debugger/src/selectors";
import { isSourceCodeCommentTypeData } from "replay-next/components/sources/utils/comments";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { isPointInRegion } from "shared/utils/time";
import { seekToComment } from "ui/actions/comments";
import { setViewMode } from "ui/actions/layout";
import useUserCommentPreferences from "ui/components/Comments/useUserCommentPreferences";
import { getViewMode } from "ui/reducers/layout";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { Comment } from "ui/state/comments";
import { isCommentContentEmpty } from "ui/utils/comments";
import { trackEvent } from "ui/utils/telemetry";

import CommentPreview from "./CommentPreview";
import CommentReplyButton from "./CommentReplyButton";
import EditableRemark from "./EditableRemark";
import ReplyCard from "./ReplyCard";
import styles from "./CommentCard.module.css";

export type PauseOverlayPosition = "after" | "before" | "current";

function CommentCard({
  comment,
  pauseOverlayPosition,
}: {
  comment: Comment;
  pauseOverlayPosition: PauseOverlayPosition | null;
}) {
  const { rangeForDisplay: focusRange } = useContext(FocusContext);
  const { currentUserInfo } = useContext(SessionContext);

  const viewMode = useAppSelector(getViewMode);

  const context = useAppSelector(getThreadContext);
  const dispatch = useAppDispatch();

  const { filter } = useUserCommentPreferences();

  const onClick = (event: MouseEvent) => {
    event.stopPropagation();

    const openSource = viewMode === "dev";
    dispatch(seekToComment(comment, comment.sourceLocation, openSource));

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

  const onPreviewClick = (event: MouseEvent) => {
    event.stopPropagation();
    dispatch(seekToComment(comment, comment.sourceLocation, true));
  };

  const showReplyButton = !isCommentContentEmpty(comment.content);

  let replies = comment.replies;
  if (filter === "current-user") {
    replies = replies.filter(reply => reply.user?.id === currentUserInfo?.id);
  }

  const isFocused = focusRange == null || isPointInRegion(comment.point, focusRange);

  return (
    <div
      className={classNames(
        styles.CommentCard,
        !comment.isPublished && styles.Unpublished,
        isFocused || styles.UnfocusedDimmed
      )}
      data-test-name="CommentCard"
      data-test-comment-time={comment.time}
      onClick={onClick}
    >
      {pauseOverlayPosition !== null && (
        <div className={styles.PausedOverlay} data-position={pauseOverlayPosition} />
      )}

      <CommentPreview comment={comment} onClick={onPreviewClick} />

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

export function getCommentTimeFromElement(element: Element) {
  return parseInt(element.getAttribute("data-test-comment-time") ?? "", 10);
}
