import Expandable from "@bvaughn/components/Expandable";
import type { EventCategory as EventCategoryType } from "@bvaughn/src/suspense/EventsCache";
import { useMemo } from "react";

import styles from "./EventCategory.module.css";
import EventType from "./EventType";

export default function EventCategory({ eventCategory }: { eventCategory: EventCategoryType }) {
  const [eventToDisplay, totalCount] = useMemo(() => {
    let totalCount = 0;

    const eventToDisplay = eventCategory.events.filter(event => {
      if (event.count > 0) {
        totalCount += event.count;

        return true;
      }
    });

    return [eventToDisplay, totalCount];
  }, [eventCategory]);

  if (totalCount === 0) {
    return null;
  }

  return (
    <Expandable
      children={
        <div className={styles.List}>
          {eventToDisplay.map(event => (
            <EventType key={event.type} event={event} />
          ))}
        </div>
      }
      header={
        <div className={styles.Header}>
          <span>{eventCategory.category}</span>
          <span className={styles.Count}>{totalCount}</span>
        </div>
      }
    />
  );
}
