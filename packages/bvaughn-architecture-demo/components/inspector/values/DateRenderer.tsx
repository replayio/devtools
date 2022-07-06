import { ObjectPreviewRendererProps } from "./types";

import styles from "./shared.module.css";

// Renders a protocol ObjectPreview representing a Date with a format of:
//   Wed Jul 06 2022 16:12:05 GMT-0400 (Eastern Daylight Time)
//
// https://static.replay.io/protocol/tot/Pause/#type-ObjectPreview
export default function DateRenderer({ object }: ObjectPreviewRendererProps) {
  const dateTime = object?.preview?.dateTime;

  let dateTimeDisplay = null;
  if (dateTime) {
    dateTimeDisplay = new Date(dateTime).toString();
  }

  return <div className={styles.Date}>{dateTimeDisplay || "Date"}</div>;
}
