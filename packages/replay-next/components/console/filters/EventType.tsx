import { MouseEvent, useContext } from "react";

import { Badge, Checkbox } from "design";
import Icon from "replay-next/components/Icon";
import { ConsoleFiltersContext } from "replay-next/src/contexts/ConsoleFiltersContext";
import { EventCounter } from "replay-next/src/suspense/EventsCache";

import styles from "./EventType.module.css";

export default function EventType({
  categoryLabel,
  disabled,
  event,
}: {
  categoryLabel: string | null;
  disabled: boolean;
  event: EventCounter;
}) {
  const { eventTypesForDisplay: eventTypes, update } = useContext(ConsoleFiltersContext);

  const checked = eventTypes[event.rawEventTypes[0]] === true;
  const newChecked = !checked;
  const toggle = () =>
    update({
      eventTypes: Object.fromEntries(
        event.rawEventTypes.map(rawEventType => [rawEventType, newChecked])
      ),
    });

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
