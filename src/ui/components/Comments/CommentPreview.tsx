import { MouseEvent } from "react";

import {
  isNetworkRequestComment,
  isSourceCodeComment,
  isVisualComment,
} from "replay-next/components/sources/utils/comments";
import { Comment } from "shared/graphql/types";

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
  if (isSourceCodeComment(comment)) {
    return (
      <div className={styles.Preview} data-test-name="CommentPreview" onClick={onClick}>
        <SourceCodePreview comment={comment} />
      </div>
    );
  } else if (isNetworkRequestComment(comment)) {
    return (
      <div className={styles.Preview} data-test-name="CommentPreview" onClick={onClick}>
        <NetworkRequestPreview comment={comment} />
      </div>
    );
  } else if (isVisualComment(comment)) {
    return (
      <div className={styles.Preview} data-test-name="CommentPreview">
        <VisualPreview comment={comment} />
      </div>
    );
  }

  return null;
}
