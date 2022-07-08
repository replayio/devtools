import Icon from "@bvaughn/components/Icon";
import { ConsoleFiltersContext } from "@bvaughn/src/contexts/ConsoleFiltersContext";
import type { Event } from "@bvaughn/src/suspense/EventsCache";
import { useContext } from "react";

import styles from "./EventType.module.css";

export default function EventType({
  categoryLabel,
  disabled,
  event,
}: {
  categoryLabel: string | null;
  disabled: boolean;
  event: Event;
}) {
  const { events, update } = useContext(ConsoleFiltersContext);

  const checked = events[event.type] === true;
  const toggle = () => update({ events: { [event.type]: !checked } });

  return (
    <label className={disabled ? styles.EventTypeDisabled : styles.EventType}>
      <input
        className={styles.Checkbox}
        disabled={disabled}
        type="checkbox"
        checked={checked}
        onChange={toggle}
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
