import {
  ChangeEvent,
  Suspense,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
} from "react";
import { STATUS_RESOLVED, useCacheStatus } from "suspense";

import Loader from "replay-next/components/Loader";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { eventCountsCache } from "replay-next/src/suspense/EventsCache";
import type { EventCategory as EventCategoryType } from "replay-next/src/suspense/EventsCache";
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
  const { range } = useContext(FocusContext);
  const pointRange = range ? { begin: range.begin.point, end: range.end.point } : null;
  const eventCategoryCounts = eventCountsCache.read(client, pointRange);

  const status = useCacheStatus(eventCountsCache, client, pointRange);
  const disabled = isPending || status !== STATUS_RESOLVED;

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

  const [eventCategoryExpandedState, setEventCategoryExpandedState] = useState<
    Map<string, boolean>
  >(new Map());

  const toggleExpanded = useCallback((category: string, expanded: boolean) => {
    setEventCategoryExpandedState(prevState => {
      const cloned = new Map(prevState.entries());
      cloned.set(category, expanded);
      return cloned;
    });
  }, []);

  return (
    <>
      <div className={styles.Header}>Common Events</div>
      {commonEventCategories.map(eventCategory => (
        <EventCategory
          key={eventCategory.category}
          defaultOpen={eventCategoryExpandedState.get(eventCategory.category) ?? false}
          disabled={disabled}
          eventCategory={eventCategory}
          filterByText={filterByText}
          onChange={expanded => toggleExpanded(eventCategory.category, expanded)}
        />
      ))}
      <div className={styles.Header}>Other Events</div>
      {otherEventCategories.map(eventCategory => (
        <EventCategory
          key={eventCategory.category}
          defaultOpen={eventCategoryExpandedState.get(eventCategory.category) ?? false}
          disabled={disabled}
          eventCategory={eventCategory}
          filterByText={filterByText}
          onChange={expanded => toggleExpanded(eventCategory.category, expanded)}
        />
      ))}
    </>
  );
}
