import { Reply } from "ui/state/comments";

import EditableRemark from "./EditableRemark";
import styles from "./ReplyCard.module.css";

export default function ReplyCard({ reply }: { reply: Reply }) {
  return (
    <div className={styles.ReplyCard}>
      <EditableRemark remark={reply} type="reply" />
    </div>
  );
}
