import Expandable from "@bvaughn/components/Expandable";
import type { EventCategory as EventCategoryType } from "@bvaughn/src/suspense/EventsCache";
import { Badge } from "design";
import { useMemo } from "react";

import styles from "./EventCategory.module.css";
import EventType from "./EventType";

export default function EventCategory({
  disabled,
  eventCategory,
  filterByText,
}: {
  disabled: boolean;
  eventCategory: EventCategoryType;
  filterByText: string;
}) {
  const [eventsWithHits, totalHitCount] = useMemo(() => {
    let totalHitCount = 0;

    const eventsWithHits = eventCategory.events.filter(event => {
      if (event.count > 0) {
        totalHitCount += event.count;

        return true;
      }
    });

    return [eventsWithHits, totalHitCount];
  }, [eventCategory]);

  const categoryName = eventCategory.category;

  const filteredEvents = useMemo(() => {
    if (!filterByText) {
      return eventsWithHits;
    }

    const filterByTextLowerCase = filterByText.toLowerCase();

    if (categoryName.toLowerCase().includes(filterByTextLowerCase)) {
      return eventsWithHits;
    }

    return eventsWithHits.filter(({ label }) => {
      return label.toLowerCase().includes(filterByTextLowerCase);
    });
  }, [categoryName, eventsWithHits, filterByText]);

  if (filteredEvents.length === 0) {
    return null;
  }

  const eventsList = (
    <div className={styles.List}>
      {filteredEvents.map(event => (
        <EventType
          key={event.type}
          categoryLabel={filterByText ? categoryName : null}
          disabled={disabled}
          event={event}
        />
      ))}
    </div>
  );

  if (filterByText) {
    return eventsList;
  } else {
    return (
      <Expandable
        children={eventsList}
        headerClassName={styles.HeaderWrapper}
        header={
          <div
            className={styles.Header}
            data-test-id={`EventCategoryHeader-${eventCategory.category}`}
          >
            <span className={styles.Category}>{eventCategory.category}</span>
            <Badge label={totalHitCount} />
          </div>
        }
      />
    );
  }
}
