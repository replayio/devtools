import { ChatAltIcon } from "@heroicons/react/solid";
import { useState } from "react";

import Icon from "bvaughn-architecture-demo/components/Icon";

import styles from "./styles.module.css";

export default function CommentThumbnail({
  primaryLabel,
  secondaryLabel,
}: {
  primaryLabel: string | null;
  secondaryLabel: string;
}) {
  const [showPreview, setShowPreview] = useState(false);

  let indicatorLeft: string | null = null;
  let indicatorTop: string | null = null;
  if (typeof primaryLabel === "string") {
    try {
      const coordinates = JSON.parse(primaryLabel);
      indicatorLeft = `${coordinates.x * 100}%`;
      indicatorTop = `${coordinates.y * 100}%`;
    } catch (error) {}
  }

  const onClick = () => setShowPreview(!showPreview);

  return (
    <div
      className={styles.OuterImageContainer}
      onClick={onClick}
      title={showPreview ? "Hide preview" : "Show preview"}
    >
      {showPreview ? (
        <div className={styles.InnerImageContainer}>
          <img className={styles.Image} src={secondaryLabel} />

          {indicatorLeft !== null && indicatorTop !== null && (
            <div
              className={styles.MarkerWrapper}
              style={{ left: indicatorLeft, top: indicatorTop }}
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
