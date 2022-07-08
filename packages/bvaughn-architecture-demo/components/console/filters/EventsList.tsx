import { getEventCategoryCounts, getStandardEventPoints } from "@bvaughn/src/suspense/EventsCache";
import type {
  Event as EventType,
  EventCategory as EventCategoryType,
} from "@bvaughn/src/suspense/EventsCache";
import { suspendInParallel } from "@bvaughn/src/utils/suspense";
import { KeyboardEvent, KeyboardEventKind, MouseEvent, MouseEventKind } from "@replayio/protocol";
import { ChangeEvent, useContext, useMemo, useState, useTransition } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import EventCategory from "./EventCategory";
import styles from "./EventsList.module.css";

export default function EventsList() {
  const client = useContext(ReplayClientContext);

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

  // TODO (console-filters) Keyboard and mouse events overlap (and conflict).
  // Maybe get rid of the call to getStandardEventPoints() and just use getEventCategoryCounts()
  // Just pull keyboard and mouse events out and show them separately?
  // That seems to be what the old console does.
  const [eventCategoryCounts, standardEventPoints] = suspendInParallel(
    () => getEventCategoryCounts(client),
    () => getStandardEventPoints(client)
  );

  const commonEventCategories = useMemo<EventCategoryType[]>(() => {
    return [
      {
        category: "Keyboard",
        events: convertEvents(standardEventPoints.keyboardEvents),
      },
      {
        category: "Mouse",
        events: convertEvents(standardEventPoints.mouseEvents),
      },
    ];
  }, [standardEventPoints]);

  return (
    <div className={styles.EventsList}>
      <input
        className={styles.FilterInput}
        onChange={onFilterTextChange}
        placeholder="Filter by event type"
        type="text"
        value={filterByDisplayText}
      />

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
      {eventCategoryCounts.map(eventCategory => (
        <EventCategory
          key={eventCategory.category}
          disabled={isPending}
          eventCategory={eventCategory}
          filterByText={filterByText}
        />
      ))}
    </div>
  );
}

// Helper method to convert–
// from Protocol events (Session.findKeyboardEvents or Session.findMouseEvents)
// to a local format used by the EventCategory component
function convertEvents(events: KeyboardEvent[] | MouseEvent[]): EventType[] {
  const returnEvents: EventType[] = [];
  const kindToEventMap = new Map<KeyboardEventKind | MouseEventKind, EventType>();

  events.forEach(({ kind }) => {
    if (!kindToEventMap.has(kind)) {
      const eventType: EventType = {
        count: 1,
        label: kind,
        type: kind,
      };

      kindToEventMap.set(kind, eventType);

      returnEvents.push(eventType);
    } else {
      const eventType = kindToEventMap.get(kind)!;
      eventType.count++;
    }
  });

  return returnEvents;
}
