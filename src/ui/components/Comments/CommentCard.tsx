import classNames from "classnames";
import { getExecutionPoint } from "devtools/client/debugger/src/selectors";
import { useDispatch, useSelector } from "react-redux";
import { seekToComment } from "ui/actions/comments";
import { getCurrentTime } from "ui/reducers/timeline";
import { Comment } from "ui/state/comments";
import { isCommentContentEmpty } from "ui/utils/comments";

import styles from "./CommentCard.module.css";
import CommentPreview from "./CommentPreview";
import CommentReplyButton from "./CommentReplyButton";
import EditableRemark from "./EditableRemark";
import LoomComment from "./LoomComment";
import ReplyCard from "./ReplyCard";

export default function CommentCard({ comment }: { comment: Comment }) {
  const currentTime = useSelector(getCurrentTime);
  const executionPoint = useSelector(getExecutionPoint);
  const isPaused = currentTime === comment.time && executionPoint === comment.point;

  const dispatch = useDispatch();

  const onClick = () => {
    dispatch(seekToComment(comment));
  };

  const loomUrl = comment.content.match(/loom\.com\/share\/(\S*?)(\"|\?)/)?.[1];

  const showReplyButton = !isCommentContentEmpty(comment.content);

  return (
    <div
      className={classNames(styles.CommentCard, !comment.isPublished && styles.Unpublished)}
      onClick={onClick}
    >
      {isPaused && <div className={styles.PausedOverlay} />}

      <CommentPreview comment={comment} />

      {loomUrl ? (
        <LoomComment loomUrl={loomUrl} />
      ) : (
        <EditableRemark remark={comment} type="comment" />
      )}

      {comment.replies.map(reply => (
        <ReplyCard key={reply.id} reply={reply} />
      ))}

      {showReplyButton && <CommentReplyButton comment={comment} />}
    </div>
  );
}
