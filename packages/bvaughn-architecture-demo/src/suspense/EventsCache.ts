import { EventHandlerType } from "@replayio/protocol";
import { ReplayClientInterface } from "shared/client/types";
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

let eventCategoryCounts: EventCategory[] | null = null;
let inProgressEventCategoryCountsWakeable: Wakeable<EventCategory[]> | null = null;

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

async function fetchEventCategoryCounts(client: ReplayClientInterface) {
  eventCategoryCounts = [];

  // Fetch event hit counts in parallel.
  const promises: Promise<void>[] = [];

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

  await Promise.all(promises);

  inProgressEventCategoryCountsWakeable!.resolve(eventCategoryCounts);
  inProgressEventCategoryCountsWakeable = null;
}
