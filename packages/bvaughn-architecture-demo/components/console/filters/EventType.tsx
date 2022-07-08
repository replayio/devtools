import Icon from "@bvaughn/components/Icon";
import type { Event } from "@bvaughn/src/suspense/EventsCache";
import { useState } from "react";

import styles from "./EventType.module.css";

export default function EventType({
  categoryLabel,
  event,
}: {
  categoryLabel: string | null;
  event: Event;
}) {
  // TODO (console-filters) This state should live in the Context (and be applied to the Console list).
  const [checked, setChecked] = useState(false);

  return (
    <label className={styles.EventType}>
      <input
        className={styles.Checkbox}
        type="checkbox"
        checked={checked}
        onChange={() => setChecked(!checked)}
      />
      <span className={styles.Label}>
        {categoryLabel && (
          <>
            <span className={styles.CategoryPrefix}>{categoryLabel}</span>
            <Icon className={styles.ArrowIcon} type="arrow" />
          </>
        )}
        <span>{event.label}</span>
      </span>
      <span className={styles.Count}>{event.count}</span>
    </label>
  );
}
