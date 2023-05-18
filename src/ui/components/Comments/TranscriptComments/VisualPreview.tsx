import { ChatAltIcon } from "@heroicons/react/solid";
import { useState } from "react";

import Icon from "replay-next/components/Icon";
import { isVisualCommentTypeData } from "replay-next/components/sources/utils/comments";
import { Comment } from "ui/state/comments";

import styles from "./styles.module.css";

// Adapter component that can handle rendering legacy or modern visual comments.
export default function VisualPreview({ comment }: { comment: Comment }) {
  const { type, typeData } = comment;

  if (isVisualCommentTypeData(type, typeData)) {
    // Modern comments store all of the information needed to render the comment preview in the typeData field.
    return (
      <ModernVisualPreview
        encodedImage={typeData.encodedImage}
        pageX={typeData.pageX}
        pageY={typeData.pageY}
        scaledX={typeData.scaledX}
        scaledY={typeData.scaledY}
      />
    );
  } else if (comment.primaryLabel && comment.secondaryLabel) {
    // Some legacy comments store JSON data in the primaryLabel field.
    return (
      <LegacyVisualPreview
        primaryLabel={comment.primaryLabel}
        secondaryLabel={comment.secondaryLabel}
      />
    );
  } else {
    return null;
  }
}

function LegacyVisualPreview({
  primaryLabel,
  secondaryLabel,
}: {
  primaryLabel: string;
  secondaryLabel: string;
}) {
  let scaledX: number | null = null;
  let scaledY: number | null = null;
  try {
    const coordinates = JSON.parse(primaryLabel);

    scaledX = coordinates.x;
    scaledY = coordinates.y;
  } catch (error) {}

  if (scaledX === null || scaledY === null) {
    return null;
  }

  // Legacy comments didn't store page X/Y but that's okay.
  let pageX = null;
  let pageY = null;

  return (
    <ModernVisualPreview
      encodedImage={secondaryLabel}
      pageX={pageX}
      pageY={pageY}
      scaledX={scaledX}
      scaledY={scaledY}
    />
  );
}

function ModernVisualPreview({
  encodedImage,
  pageX,
  pageY,
  scaledX,
  scaledY,
}: {
  encodedImage: string | null;
  pageX: number | null;
  pageY: number | null;
  scaledX: number | null;
  scaledY: number | null;
}) {
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
