import Expandable from "@bvaughn/components/Expandable";
import type { EventCategory as EventCategoryType } from "@bvaughn/src/constants";
import { getEventCategoryCounts } from "@bvaughn/src/suspense/EventsCache";
import { useContext, useMemo } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import styles from "./EventCategory.module.css";
import EventType from "./EventType";

export default function EventCategory({ eventCategory }: { eventCategory: EventCategoryType }) {
  const client = useContext(ReplayClientContext);
  const eventCategoryCounts = getEventCategoryCounts(client);

  const eventToDisplay = useMemo(() => {
    return Array.from(Object.entries(eventCategory.eventTypeMap)).filter(([eventType]) => {
      const count = eventCategoryCounts.get(eventType);
      if (count != null && count > 0) {
        return eventType;
      }
    });
  }, [eventCategory, eventCategoryCounts]);

  if (eventToDisplay.length === 0) {
    return null;
  }

  return (
    <Expandable
      children={
        <div className={styles.List}>
          {eventToDisplay.map(([eventType, label]) => (
            <EventType
              key={eventType}
              eventCategoryCounts={eventCategoryCounts}
              eventType={eventType}
              label={label}
            />
          ))}
        </div>
      }
      header={<div className={styles.Header}>{eventCategory.category}</div>}
    />
  );
}
