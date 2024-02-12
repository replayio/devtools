import { ChatAltIcon } from "@heroicons/react/solid";
import { useState } from "react";

import Icon from "replay-next/components/Icon";
import { VisualComment } from "replay-next/components/sources/utils/comments";

import styles from "./styles.module.css";

// Adapter component that can handle rendering legacy or modern visual comments.
export default function VisualPreview({ comment }: { comment: VisualComment }) {
  const { encodedImage, scaledX, scaledY } = comment.typeData;

  const [showPreview, setShowPreview] = useState(false);

  if (encodedImage === null) {
    return null;
  }

  const onClick = () => setShowPreview(!showPreview);

  return (
    <div
      className={styles.OuterImageContainer}
      data-test-name="CommentPreview-TogglePreviewButton"
      data-test-preview-state={showPreview ? "visible" : "hidden"}
      onClick={onClick}
      title={showPreview ? "Hide preview" : "Show preview"}
    >
      {showPreview ? (
        <div className={styles.InnerImageContainer}>
          <img className={styles.Image} src={encodedImage} />

          {scaledX !== null && scaledY !== null && (
            <div
              className={styles.MarkerWrapper}
              style={{ left: `${scaledX * 100}%`, top: `${scaledY * 100}%` }}
            >
              <ChatAltIcon className={styles.MarkerIcon} />
            </div>
          )}
        </div>
      ) : (
        <div className={styles.ShowPreviewPrompt}>
          <Icon className={styles.PreviewIcon} type="preview" />
          Show preview
        </div>
      )}
    </div>
  );
}
