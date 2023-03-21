import { useMemo } from "react";

import { Badge } from "design";
import Expandable from "replay-next/components/Expandable";
import type { EventCategory as EventCategoryType } from "replay-next/src/suspense/EventsCache";

import EventType from "./EventType";
import styles from "./EventCategory.module.css";

export default function EventCategory({
  defaultOpen,
  disabled,
  eventCategory,
  filterByText,
  onChange,
}: {
  defaultOpen: boolean;
  disabled: boolean;
  eventCategory: EventCategoryType;
  filterByText: string;
  onChange: (open: boolean) => void;
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
        defaultOpen={defaultOpen}
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
        onChange={onChange}
      />
    );
  }
}
