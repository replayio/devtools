import Icon from "@bvaughn/components/Icon";
import { ConsoleFiltersContext } from "@bvaughn/src/contexts/ConsoleFiltersContext";
import { Event } from "@bvaughn/src/suspense/EventsCache";
import { useContext } from "react";

import { Checkbox } from "../../Checkbox";

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
  const { eventTypesForDisplay: eventTypes, update } = useContext(ConsoleFiltersContext);

  const checked = eventTypes[event.type] === true;
  const toggle = () => update({ eventTypes: { [event.type]: !checked } });

  return (
    <label
      className={disabled ? styles.EventTypeDisabled : styles.EventType}
      data-test-id={`EventTypes-${event.type}`}
    >
      <Checkbox disabled={disabled} checked={checked} onChange={toggle} />
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
