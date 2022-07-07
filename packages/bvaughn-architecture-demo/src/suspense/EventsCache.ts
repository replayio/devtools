import { EventHandlerType } from "@replayio/protocol";
import { Events, ReplayClientInterface } from "shared/client/types";
import { STANDARD_EVENT_CATEGORIES } from "../constants";
import { createWakeable } from "../utils/suspense";
import { Wakeable } from "./types";

export type Event = {
  count: number;
  label: string;
  type: EventHandlerType;
};

export type EventCategory = {
  category: string;
  events: Event[];
};

let events: Events | null = null;
let eventCategoryCounts: EventCategory[] | null = null;
let inProgressEventCategoryCountsWakeable: Wakeable<EventCategory[]> | null = null;
let inProgressEventsWakeable: Wakeable<Events> | null = null;

export function getEventCategoryCounts(client: ReplayClientInterface): EventCategory[] {
  if (eventCategoryCounts !== null) {
    return eventCategoryCounts;
  }

  if (inProgressEventCategoryCountsWakeable === null) {
    inProgressEventCategoryCountsWakeable = createWakeable<EventCategory[]>();

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
  eventCategoryCounts = [];

  // Fetch event hit counts in parallel.
  const promises = [];

  STANDARD_EVENT_CATEGORIES.forEach(category => {
    const categoryWithCounts: EventCategory = {
      category: category.category,
      events: [],
    };

    category.events.forEach(event => {
      promises.push(
        (async () => {
          const count = await client.getEventCountForType(event.type);

          categoryWithCounts.events.push({
            count,
            label: event.label,
            type: event.type,
          });
        })()
      );
    });

    eventCategoryCounts?.push(categoryWithCounts);
  });

  inProgressEventCategoryCountsWakeable!.resolve(eventCategoryCounts);
  inProgressEventCategoryCountsWakeable = null;
}

async function fetchStandardEventPoints(client: ReplayClientInterface) {
  events = await client.getStandardEventPoints();

  inProgressEventsWakeable!.resolve(events!);
  inProgressEventsWakeable = null;
}
