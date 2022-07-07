import { STANDARD_EVENT_CATEGORIES } from "@bvaughn/src/constants";
import { getEventCategoryCounts, getStandardEventPoints } from "@bvaughn/src/suspense/EventsCache";
import { useContext } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import EventCategory from "./EventCategory";
import styles from "./EventsList.module.css";

export default function EventsList() {
  const client = useContext(ReplayClientContext);

  const { keyboardEvents, mouseEvents, navigationEvents } = getStandardEventPoints(client);
  // console.log(JSON.stringify({ keyboardEvents, mouseEvents, navigationEvents }, null, 2));

  // TODO (console:filters)
  const eventCategoryCounts = getEventCategoryCounts(client);
  // console.log("eventCategoryCounts:", eventCategoryCounts);

  // TODO (console:filters)
  // Filter text
  //
  // Comment Events
  // |> Keyboard
  // |> Mouse
  //
  // Other Events
  // |> ...

  return (
    <div className={styles.EventsList}>
      {/* TODO (console:filter) Filter input */}

      <div className={styles.Header}>Common Events</div>
      {/* TODO (console:filter) Keyboard events */}
      {/* TODO (console:filter) Mouse events */}

      <div className={styles.Header}>Other Events</div>
      {STANDARD_EVENT_CATEGORIES.map(eventCategory => (
        <EventCategory key={eventCategory.category} eventCategory={eventCategory} />
      ))}
    </div>
  );
}
