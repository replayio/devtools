import { MouseEvent, useContext } from "react";
import { STATUS_PENDING, STATUS_REJECTED, useIntervalCacheStatus } from "suspense";

import { Badge, Checkbox } from "design";
import Icon from "replay-next/components/Icon";
import { ConsoleFiltersContext } from "replay-next/src/contexts/ConsoleFiltersContext";
import { useCurrentFocusPointRange } from "replay-next/src/hooks/useCurrentFocusPointRange";
import useTooltip from "replay-next/src/hooks/useTooltip";
import { Event, eventPointsCache } from "replay-next/src/suspense/EventsCache";
import { MAX_POINTS_TO_RUN_EVALUATION } from "shared/client/ReplayClient";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

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
  const client = useContext(ReplayClientContext);

  const focusPointRange = useCurrentFocusPointRange();

  const status = useIntervalCacheStatus(
    eventPointsCache,
    BigInt(focusPointRange.begin),
    BigInt(focusPointRange.end),
    client,
    [event.type]
  );

  const { onMouseEnter, onMouseLeave, tooltip } = useTooltip({
    position: "left-of",
    tooltip: "There are too many events. Please focus to a smaller time range and try again.",
  });

  const checked = eventTypes[event.rawEventTypes[0]]?.enabled ?? false;
  const newChecked = !checked;
  const toggle = () => {
    update({
      eventTypes: Object.fromEntries(
        event.rawEventTypes.map(rawEventType => [
          rawEventType,
          {
            enabled: newChecked,
            label: event.label,
          },
        ])
      ),
    });
  };

  const stopPropagation = (event: MouseEvent) => {
    event.stopPropagation();
  };

  let showErrorBadge = checked && event.count > MAX_POINTS_TO_RUN_EVALUATION;
  let className = styles.EventType;
  switch (status) {
    case STATUS_PENDING:
      className = styles.EventTypePending;
      break;
    case STATUS_REJECTED:
      if (checked) {
        className = styles.EventTypeRejected;
        showErrorBadge = true;
      }
      break;
    default:
      if (disabled) {
        className = styles.EventTypeDisabled;
      }
      break;
  }

  return (
    <label
      className={className}
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
      <span onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        <Badge label={event.count} showErrorBadge={showErrorBadge} />
      </span>
      {showErrorBadge && tooltip}
    </label>
  );
}
