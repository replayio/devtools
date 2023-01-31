import { EventHandlerType, ExecutionPoint, PointDescription, PointRange } from "@replayio/protocol";

import { ReplayClientInterface } from "shared/client/types";

import { STANDARD_EVENT_CATEGORIES } from "../constants";
import { createWakeable } from "../utils/suspense";
import { getAnalysisCache } from "./NewAnalysisCache";
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

export type EventLog = PointDescription & {
  eventType: EventHandlerType;
  type: "EventLog";
};

let eventCategoryCounts: EventCategory[] | null = null;
let inProgressEventCategoryCountsWakeable: Wakeable<EventCategory[]> | null = null;

export function getEventCategoryCountsSuspense(client: ReplayClientInterface): EventCategory[] {
  if (eventCategoryCounts !== null) {
    return eventCategoryCounts;
  }

  if (inProgressEventCategoryCountsWakeable === null) {
    inProgressEventCategoryCountsWakeable = createWakeable<EventCategory[]>(
      "getEventCategoryCountsSuspense"
    );

    fetchEventCategoryCounts(client);
  }

  throw inProgressEventCategoryCountsWakeable;
}

async function fetchEventCategoryCounts(client: ReplayClientInterface) {
  const pendingEventCategoryCounts: EventCategory[] = [];

  const allEvents = await client.getEventCountForTypes(
    Object.values(STANDARD_EVENT_CATEGORIES)
      .map(c => c.events.map(e => e.type))
      .flat()
  );
  eventCategoryCounts = Object.values(STANDARD_EVENT_CATEGORIES).map(category => {
    return {
      ...category,
      events: category.events.map(eventType => ({
        ...eventType,
        count: allEvents[eventType.type],
      })),
    };
  });

  inProgressEventCategoryCountsWakeable!.resolve(pendingEventCategoryCounts);
  inProgressEventCategoryCountsWakeable = null;
}

export const MAPPER = `
  const finalData = { frames: [], scopes: [], objects: [] };
  function addPauseData({ frames, scopes, objects }) {
    finalData.frames.push(...(frames || []));
    finalData.scopes.push(...(scopes || []));
    finalData.objects.push(...(objects || []));
  }
  function getTopFrame() {
    const { frame, data } = sendCommand("Pause.getTopFrame");
    addPauseData(data);
    return finalData.frames.find((f) => f.frameId == frame);
  }

  const { time, pauseId, point } = input;
  const { frameId, location } = getTopFrame();
  const { result } = sendCommand("Pause.evaluateInFrame", {
    frameId,
    expression: "[...arguments]",
  });
  const values = [];
  addPauseData(result.data);
  if (result.exception) {
    values.push(result.exception);
  } else {
    {
      const { object } = result.returned;
      const { result: lengthResult } = sendCommand("Pause.getObjectProperty", {
        object,
        name: "length",
      });
      addPauseData(lengthResult.data);
      const length = lengthResult.returned.value;
      for (let i = 0; i < length; i++) {
        const { result: elementResult } = sendCommand("Pause.getObjectProperty", {
          object,
          name: i.toString(),
        });
        values.push(elementResult.returned);
        addPauseData(elementResult.data);
      }
    }
  }
  let frameworkListeners;

  const { result: frameworkResult } = sendCommand("Pause.evaluateInFrame", {
    frameId,
    expression: "",
  });
  addPauseData(frameworkResult.data);
  frameworkListeners = frameworkResult.returned;

  return [
    {
      key: point,
      value: {
        time,
        pauseId,
        point,
        location,
        values,
        data: finalData,
        frameworkListeners,
      },
    },
  ];
`;

function getEventCache(eventType: EventHandlerType) {
  return getAnalysisCache<EventLog>(
    {
      eventTypes: [eventType],
      mapper: MAPPER,
    },
    point => ({ ...point, eventType, type: "EventLog" })
  );
}

export function getEventPointsSuspense(
  client: ReplayClientInterface,
  eventType: EventHandlerType,
  range: PointRange
) {
  return getEventCache(eventType).getPointsSuspense(client, range);
}

export function getEventPointsAsync(
  client: ReplayClientInterface,
  eventType: EventHandlerType,
  range: PointRange
) {
  return getEventCache(eventType).getPointsAsync(client, range);
}

export function getCachedEventPoints(eventType: EventHandlerType, range: PointRange) {
  return getEventCache(eventType).getCachedPoints(range);
}

export function getEventSuspense(eventType: EventHandlerType, point: ExecutionPoint) {
  return getEventCache(eventType).getResultSuspense(point);
}

export function getEventAsync(eventType: EventHandlerType, point: ExecutionPoint) {
  return getEventCache(eventType).getResultAsync(point);
}

export function getEventIfCached(eventType: EventHandlerType, point: ExecutionPoint) {
  return getEventCache(eventType).getResultIfCached(point);
}
