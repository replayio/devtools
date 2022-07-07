import type { Event } from "@bvaughn/src/suspense/EventsCache";
import { useState } from "react";

import styles from "./EventType.module.css";

export default function EventType({ event }: { event: Event }) {
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
      <span className={styles.Label}>{event.label}</span>
      <span className={styles.Count}>{event.count}</span>
    </label>
  );
}
