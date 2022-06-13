import { useFeature } from "ui/hooks/settings";
import { Comment } from "ui/state/comments";

import styles from "./CommentPreview.module.css";
import CommentSource from "./TranscriptComments/CommentSource";
import NetworkRequestPreview from "./TranscriptComments/NetworkRequestPreview";

export default function CommentPreview({ comment }: { comment: Comment }) {
  const { value: networkRequestComments } = useFeature("networkRequestComments");

  if (comment.sourceLocation) {
    return (
      <div className={styles.Preview}>
        <CommentSource comment={comment} />
      </div>
    );
  } else if (comment.networkRequestId && networkRequestComments) {
    return (
      <div className={styles.Preview}>
        <NetworkRequestPreview networkRequestId={comment.networkRequestId} />
      </div>
    );
  } else {
    return null;
  }
}
