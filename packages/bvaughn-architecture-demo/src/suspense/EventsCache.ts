import { EventHandlerType } from "@replayio/protocol";
import { Events, ReplayClientInterface } from "shared/client/types";
import { EventCategory, STANDARD_EVENT_CATEGORIES } from "../constants";
import { createWakeable } from "../utils/suspense";
import { Wakeable } from "./types";

export type EventTypeToCountMap = Map<EventHandlerType, number>;

let events: Events | null = null;
let eventTypeToCountMap: EventTypeToCountMap | null = null;
let inProgressEventCategoryCountsWakeable: Wakeable<EventTypeToCountMap> | null = null;
let inProgressEventsWakeable: Wakeable<Events> | null = null;

export function getEventCategoryCounts(client: ReplayClientInterface): EventTypeToCountMap {
  if (eventTypeToCountMap !== null) {
    return eventTypeToCountMap;
  }

  if (inProgressEventCategoryCountsWakeable === null) {
    inProgressEventCategoryCountsWakeable = createWakeable<EventTypeToCountMap>();

    fetchEventCategoryCounts(client);
  }

  throw inProgressEventCategoryCountsWakeable;
}

export function getStandardEventPoints(client: ReplayClientInterface): Events {
  if (events !== null) {
    return events;
  }

  if (inProgressEventsWakeable === null) {
    inProgressEventsWakeable = createWakeable<Events>();

    fetchStandardEventPoints(client);
  }

  throw inProgressEventsWakeable;
}

async function fetchEventCategoryCounts(client: ReplayClientInterface) {
  eventTypeToCountMap = new Map();

  const eventTypes = STANDARD_EVENT_CATEGORIES.reduce(
    (eventTypes: EventHandlerType[], current: EventCategory) => {
      Object.keys(current.eventTypeMap).forEach((eventType: string) => {
        eventTypes.push(eventType);
      });
      return eventTypes;
    },
    []
  );

  // Fetch event hit counts in parallel.
  await Promise.all(
    eventTypes.map(eventType =>
      (async () => {
        const count = await client.getEventCountForType(eventType);
        eventTypeToCountMap!.set(eventType, count);
      })()
    )
  );

  inProgressEventCategoryCountsWakeable!.resolve(eventTypeToCountMap);
  inProgressEventCategoryCountsWakeable = null;
}

async function fetchStandardEventPoints(client: ReplayClientInterface) {
  events = await client.getStandardEventPoints();

  inProgressEventsWakeable!.resolve(events!);
  inProgressEventsWakeable = null;
}
