import { MouseEvent } from "react";

import { Comment } from "ui/state/comments";

import CommentSource from "./TranscriptComments/CommentSource";
import CommentThumbnail from "./TranscriptComments/CommentThumbnail";
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
    const { primaryLabel, secondaryLabel } = comment;
    if (typeof secondaryLabel === "string" && secondaryLabel.startsWith("data:image")) {
      return (
        <div className={styles.Preview}>
          <CommentThumbnail primaryLabel={primaryLabel ?? null} secondaryLabel={secondaryLabel} />
        </div>
      );
    }

    return null;
  }
}
