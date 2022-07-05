import { ObjectPreviewRendererProps } from "./types";

import styles from "./shared.module.css";

// Renders a protocol ObjectPreview representing an Error with a format of:
//   ErrorName: Error message...
//
// https://static.replay.io/protocol/tot/Pause/#type-ObjectPreview
export default function ErrorRenderer({ object }: ObjectPreviewRendererProps) {
  const messageProperty = object?.preview?.properties?.find(
    property => property.name === "message"
  );
  return (
    <div className={styles.Error}>
      {object.className}
      {messageProperty ? `: ${messageProperty.value}` : ""}
    </div>
  );
}
