import { ChangeEvent, Suspense, useContext, useMemo, useState, useTransition } from "react";

import Loader from "bvaughn-architecture-demo/components/Loader";
import { getEventCategoryCountsSuspense } from "bvaughn-architecture-demo/src/suspense/EventsCache";
import type { EventCategory as EventCategoryType } from "bvaughn-architecture-demo/src/suspense/EventsCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import EventCategory from "./EventCategory";
import styles from "./EventsList.module.css";

export default function EventsList() {
  const [filterByDisplayText, setFilterByDisplayText] = useState("");
  const [filterByText, setFilterByText] = useState("");
  const [isPending, startTransition] = useTransition();

  const onFilterTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newFilterByText = event.currentTarget.value;
    setFilterByDisplayText(newFilterByText);
    startTransition(() => {
      setFilterByText(newFilterByText);
    });
  };

  return (
    <div className={styles.EventsList}>
      <input
        className={styles.FilterInput}
        data-test-id="EventTypeFilterInput"
        onChange={onFilterTextChange}
        placeholder="Filter by event type"
        type="text"
        value={filterByDisplayText}
      />

      <Suspense fallback={<Loader />}>
        <EventsListCategories filterByText={filterByText} isPending={isPending} />
      </Suspense>
    </div>
  );
}

function EventsListCategories({
  filterByText,
  isPending,
}: {
  filterByText: string;
  isPending: boolean;
}) {
  const client = useContext(ReplayClientContext);

  const eventCategoryCounts = getEventCategoryCountsSuspense(client);

  const [commonEventCategories, otherEventCategories] = useMemo<
    [EventCategoryType[], EventCategoryType[]]
  >(() => {
    const commonEventCategories: EventCategoryType[] = [];
    const otherEventCategories: EventCategoryType[] = [];

    eventCategoryCounts.forEach(category => {
      switch (category.category) {
        case "Keyboard":
        case "Mouse":
          commonEventCategories.push(category);
          break;
        default:
          otherEventCategories.push(category);
          break;
      }
    });

    return [commonEventCategories, otherEventCategories];
  }, [eventCategoryCounts]);

  return (
    <>
      <div className={styles.Header}>Common Events</div>
      {commonEventCategories.map(eventCategory => (
        <EventCategory
          key={eventCategory.category}
          disabled={isPending}
          eventCategory={eventCategory}
          filterByText={filterByText}
        />
      ))}
      <div className={styles.Header}>Other Events</div>
      {otherEventCategories.map(eventCategory => (
        <EventCategory
          key={eventCategory.category}
          disabled={isPending}
          eventCategory={eventCategory}
          filterByText={filterByText}
        />
      ))}
    </>
  );
}
