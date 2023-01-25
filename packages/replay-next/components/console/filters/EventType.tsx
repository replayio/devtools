import { MouseEvent, useContext } from "react";

import { Badge, Checkbox } from "design";
import Icon from "replay-next/components/Icon";
import { ConsoleFiltersContext } from "replay-next/src/contexts/ConsoleFiltersContext";
import { Event } from "replay-next/src/suspense/EventsCache";

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

  const stopPropagation = (event: MouseEvent) => {
    event.stopPropagation();
  };

  return (
    <label
      className={disabled ? styles.EventTypeDisabled : styles.EventType}
      data-test-id={`EventTypes-${event.type}`}
      data-test-name="EventTypeToggle"
      onClick={stopPropagation}
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
      <Badge label={event.count} />
    </label>
  );
}
