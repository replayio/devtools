import classNames from "classnames";
import { Reply } from "ui/state/comments";

import EditableRemark from "./EditableRemark";
import LoomComment from "./LoomComment";
import styles from "./ReplyCard.module.css";

export default function ReplyCard({ reply }: { reply: Reply }) {
  const loomUrl = reply.content.match(/loom\.com\/share\/(\S*?)(\"|\?)/)?.[1];

  return (
    <div className={classNames(styles.ReplyCard, !reply.isPublished && styles.Unpublished)}>
      {loomUrl ? <LoomComment loomUrl={loomUrl} /> : <EditableRemark remark={reply} type="reply" />}
    </div>
  );
}
