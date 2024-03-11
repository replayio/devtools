import classNames from "classnames";
import { memo } from "react";

import { Reply } from "shared/graphql/types";

import EditableRemark from "./EditableRemark";
import styles from "./ReplyCard.module.css";

function ReplyCard({ reply }: { reply: Reply }) {
  return (
    <div
      className={classNames(styles.ReplyCard, !reply.isPublished && styles.Unpublished)}
      data-test-comment-id={reply.id}
      data-test-comment-type="reply"
      data-test-id={`CommentCard-${reply.id}`}
      data-test-name="CommentCard"
    >
      <EditableRemark remark={reply} type="reply" />
    </div>
  );
}

const MemoizedReplyCard = memo(ReplyCard);
export default MemoizedReplyCard;
