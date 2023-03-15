import { PointDescription, PointRange } from "@replayio/protocol";
import { EventHandlerType, ExecutionPoint, PauseData } from "@replayio/protocol";
import { Cache, createCache } from "suspense";

import { AnalysisInput, SendCommand, getFunctionBody } from "protocol/evaluation-utils";
import { ReplayClientInterface } from "shared/client/types";

import { STANDARD_EVENT_CATEGORIES } from "../constants";
import { createInfallibleSuspenseCache } from "../utils/suspense";
import { getAnalysisCache } from "./AnalysisCache";

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

export const eventsCache: Cache<
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

// Variables in scope in an analysis
declare let sendCommand: SendCommand;
declare let input: AnalysisInput;

export function eventsMapper() {
  const finalData: Required<PauseData> = { frames: [], scopes: [], objects: [] };
  function addPauseData({ frames, scopes, objects }: PauseData) {
    finalData.frames.push(...(frames || []));
    finalData.scopes.push(...(scopes || []));
    finalData.objects.push(...(objects || []));
  }

  const { time, pauseId, point } = input;
  const { frame, data } = sendCommand("Pause.getTopFrame", {});
  addPauseData(data);
  const { frameId, location } = finalData.frames.find(f => f.frameId == frame)!;

  // Retrieve protocol value details on the stack frame's arguments
  const { result } = sendCommand("Pause.evaluateInFrame", {
    frameId,
    expression: "[...arguments]",
  });
  const values = [];
  addPauseData(result.data);

  if (result.exception) {
    values.push(result.exception);
  } else {
    // We got back an array of arguments. The protocol requires that we ask for each
    // array index's contents separately, which is annoying.
    const { object } = result.returned!;
    const { result: lengthResult } = sendCommand("Pause.getObjectProperty", {
      object: object!,
      name: "length",
    });
    addPauseData(lengthResult.data);
    const length = lengthResult.returned!.value;
    for (let i = 0; i < length; i++) {
      const { result: elementResult } = sendCommand("Pause.getObjectProperty", {
        object: object!,
        name: i.toString(),
      });
      values.push(elementResult.returned);
      addPauseData(elementResult.data);
    }
  }

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
      },
    },
  ];
}
function getEventCache(eventType: EventHandlerType) {
  return getAnalysisCache<EventLog>(
    {
      eventTypes: [eventType],
      mapper: getFunctionBody(eventsMapper),
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

export function getInfallibleEventPointsSuspense(
  client: ReplayClientInterface,
  eventType: EventHandlerType,
  range: PointRange
) {
  return createInfallibleSuspenseCache(getEventCache(eventType).getPointsSuspense)(client, range);
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
