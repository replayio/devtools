import type { EventTypeToCountMap } from "@bvaughn/src/suspense/EventsCache";
import { useState } from "react";

import styles from "./EventType.module.css";

export default function EventType({
  eventCategoryCounts,
  eventType,
  label,
}: {
  eventCategoryCounts: EventTypeToCountMap;
  eventType: string;
  label: string;
}) {
  const [checked, setChecked] = useState(false);

  // TODO (console-filters) Add to Console

  return (
    <label className={styles.EventType}>
      <input
        className={styles.Checkbox}
        type="checkbox"
        checked={checked}
        onChange={() => setChecked(!checked)}
      />
      <span className={styles.Label}>{label}</span>
      <span>{eventCategoryCounts.get(eventType) || 0}</span>
    </label>
  );
}
