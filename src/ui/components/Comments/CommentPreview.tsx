import { MouseEvent } from "react";

import {
  isNetworkRequestCommentTypeData,
  isSourceCodeCommentTypeData,
  isVisualCommentTypeData,
} from "replay-next/components/sources/utils/comments";
import { Comment } from "ui/state/comments";

import NetworkRequestPreview from "./TranscriptComments/NetworkRequestPreview";
import SourceCodePreview from "./TranscriptComments/SourceCodePreview";
import VisualPreview from "./TranscriptComments/VisualPreview";
import styles from "./CommentPreview.module.css";

export default function CommentPreview({
  comment,
  onClick,
}: {
  comment: Comment;
  onClick: (event: MouseEvent) => void;
}) {
  if (comment.sourceLocation || isSourceCodeCommentTypeData(comment.type, comment.typeData)) {
    return (
      <div className={styles.Preview} data-test-name="CommentPreview" onClick={onClick}>
        <SourceCodePreview comment={comment} />
      </div>
    );
  } else if (
    comment.networkRequestId ||
    isNetworkRequestCommentTypeData(comment.type, comment.typeData)
  ) {
    return (
      <div className={styles.Preview} data-test-name="CommentPreview" onClick={onClick}>
        <NetworkRequestPreview comment={comment} />
      </div>
    );
  } else if (
    (typeof comment.secondaryLabel === "string" &&
      comment.secondaryLabel.startsWith("data:image")) ||
    isVisualCommentTypeData(comment.type, comment.typeData)
  ) {
    return (
      <div className={styles.Preview} data-test-name="CommentPreview">
        <VisualPreview comment={comment} />
      </div>
    );
  }

  return null;
}
