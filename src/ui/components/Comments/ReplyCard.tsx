import classNames from "classnames";

import { Reply } from "ui/state/comments";

import EditableRemark from "./EditableRemark";
import styles from "./ReplyCard.module.css";

export default function ReplyCard({ reply }: { reply: Reply }) {
  return (
    <div className={classNames(styles.ReplyCard, !reply.isPublished && styles.Unpublished)}>
      <EditableRemark remark={reply} type="reply" />
    </div>
  );
}
