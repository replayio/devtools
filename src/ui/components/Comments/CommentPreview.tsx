import { MouseEvent } from "react";

import { Comment } from "ui/state/comments";

import CommentSource from "./TranscriptComments/CommentSource";
import NetworkRequestPreview from "./TranscriptComments/NetworkRequestPreview";
import styles from "./CommentPreview.module.css";

export default function CommentPreview({
  comment,
  onClick,
}: {
  comment: Comment;
  onClick: (event: MouseEvent) => void;
}) {
  if (comment.sourceLocation) {
    return (
      <div className={styles.Preview} onClick={onClick}>
        <CommentSource comment={comment} />
      </div>
    );
  } else if (comment.networkRequestId) {
    return (
      <div className={styles.Preview} onClick={onClick}>
        <NetworkRequestPreview networkRequestId={comment.networkRequestId} />
      </div>
    );
  } else {
    return null;
  }
}
