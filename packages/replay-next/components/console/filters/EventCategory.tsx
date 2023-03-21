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
  const { events } = eventCategory;

  const totalHitCount = useMemo(() => {
    let count = 0;

    events.forEach(event => {
      if (event.count > 0) {
        count += event.count;

        return true;
      }
    });

    return count;
  }, [events]);

  const categoryName = eventCategory.category;

  const filteredEvents = useMemo(() => {
    if (!filterByText) {
      return events;
    }

    const filterByTextLowerCase = filterByText.toLowerCase();

    if (categoryName.toLowerCase().includes(filterByTextLowerCase)) {
      return events;
    }

    return events.filter(({ label }) => {
      return label.toLowerCase().includes(filterByTextLowerCase);
    });
  }, [categoryName, events, filterByText]);

  if (filteredEvents.length === 0) {
    return null;
  }

  const eventsList = (
    <div className={styles.List}>
      {filteredEvents.map(event => (
        <EventType
          key={event.type}
          categoryLabel={filterByText ? categoryName : null}
          disabled={disabled || event.count === 0}
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
            data-disabled={disabled || totalHitCount === 0 || undefined}
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
