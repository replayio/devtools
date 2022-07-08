import { EventHandlerType, PointDescription } from "@replayio/protocol";
import { ReplayClientInterface } from "shared/client/types";
import { STANDARD_EVENT_CATEGORIES } from "../constants";
import { createWakeable } from "../utils/suspense";
import { Record, STATUS_PENDING, STATUS_RESOLVED, Wakeable } from "./types";

export type Event = {
  count: number;
  label: string;
  type: EventHandlerType;
};

export type EventCategory = {
  category: string;
  events: Event[];
};

let eventTypeToEntryPointMap = new Map<EventHandlerType, Record<PointDescription[]>>();
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

export function getEventTypeEntryPoints(
  client: ReplayClientInterface,
  eventType: EventHandlerType
): PointDescription[] {
  let record = eventTypeToEntryPointMap.get(eventType);
  if (record == null) {
    record = {
      status: STATUS_PENDING,
      value: createWakeable<PointDescription[]>(),
    };

    eventTypeToEntryPointMap.set(eventType, record);

    fetchEventTypeEntryPoints(client, eventType,record);
  }

  if (record.status === STATUS_RESOLVED) {
    return record.value;
  } else {
    throw record.value;
  }
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

async function fetchEventTypeEntryPoints(client: ReplayClientInterface,eventType: EventHandlerType, record: Record<PointDescription[]>) {
  const entryPoints = await client.getEntryPointsForEventType(eventType);

  const wakeable = record.value;

  record.status = STATUS_RESOLVED;
  record.value = entryPoints;

  wakeable.resolve(entryPoints);
}
