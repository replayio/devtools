import classNames from "classnames";
import { getExecutionPoint } from "devtools/client/debugger/src/selectors";
import { useSelector } from "react-redux";
import { getCurrentTime } from "ui/reducers/timeline";
import { Comment } from "ui/state/comments";

import styles from "./CommentCard.module.css";
import CommentPreview from "./CommentPreview";
import CommentReplyButton from "./CommentReplyButton";
import EditableRemark from "./EditableRemark";
import ReplyCard from "./ReplyCard";

export default function CommentCard({ comment }: { comment: Comment }) {
  const currentTime = useSelector(getCurrentTime);
  const executionPoint = useSelector(getExecutionPoint);
  const isPaused = currentTime === comment.time && executionPoint === comment.point;

  return (
    <div className={classNames(styles.CommentCard, isPaused && styles.Paused)}>
      <CommentPreview comment={comment} />

      <EditableRemark remark={comment} type="comment" />

      {comment.replies.map(reply => (
        <ReplyCard key={reply.id} reply={reply} />
      ))}

      <CommentReplyButton comment={comment} />
    </div>
  );
}
