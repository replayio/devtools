import { PointDescription, PointRange, PointSelector } from "@replayio/protocol";
import { EventHandlerType } from "@replayio/protocol";
import { Cache, createCache } from "suspense";

import { ReplayClientInterface } from "shared/client/types";

import { STANDARD_EVENT_CATEGORIES } from "../constants";
import { createInfallibleSuspenseCache } from "../utils/suspense";
import { createAnalysisCache } from "./AnalysisCache";

export type Event = {
  count: number;
  label: string;
  type: EventHandlerType;
};

export type EventCategory = {
  category: string;
  events: Event[];
};

export type EventLog = PointDescription & {
  eventType: EventHandlerType;
  type: "EventLog";
};

export const eventCountsCache: Cache<
  [client: ReplayClientInterface, range: PointRange | null],
  EventCategory[]
> = createCache({
  debugLabel: "Events",
  getKey: ([client, range]) => (range ? `${range.begin}:${range.end}` : ""),
  load: async ([client, range]) => {
    const allEvents = await client.getEventCountForTypes(
      Object.values(STANDARD_EVENT_CATEGORIES)
        .map(c => c.events.map(e => e.type))
        .flat(),
      range
    );
    return Object.values(STANDARD_EVENT_CATEGORIES).map(category => {
      return {
        ...category,
        events: category.events.map(eventType => ({
          ...eventType,
          count: allEvents[eventType.type],
        })),
      };
    });
  },
});

export const eventsCache = createAnalysisCache<EventLog, [EventHandlerType]>(
  "EventsCache",
  eventType => eventType,
  (client, begin, end, eventType) =>
    client.findPoints(createPointSelector(eventType), { begin, end }),
  (points, eventType) => {
    return {
      selector: createPointSelector(eventType),
      expression: "[...arguments]",
      frameIndex: 0,
      fullPropertyPreview: true,
    };
  },
  transformPoint
);

export const getInfallibleEventPointsSuspense = createInfallibleSuspenseCache(
  eventsCache.pointsIntervalCache.read
);

function createPointSelector(eventType: EventHandlerType): PointSelector {
  return { kind: "event-handlers", eventType };
}

function transformPoint(point: PointDescription, eventType: EventHandlerType): EventLog {
  return { ...point, eventType, type: "EventLog" };
}
