import {
  EventHandlerType,
  ExecutionPoint,
  Frame,
  Location,
  Object,
  PauseId,
} from "@replayio/protocol";
import { ReplayClientInterface } from "shared/client/types";
import { STANDARD_EVENT_CATEGORIES } from "../constants";
import { createWakeable } from "../utils/suspense";
import { preCacheObjects } from "./ObjectPreviews";
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

export type EventLog = {
  data: {
    frames: Frame[];
    objects: Object[];
  };
  location: Location[];
  pauseId: PauseId;
  point: ExecutionPoint;
  time: number;
  type: "EventLog";
  values: any[];
};

let eventTypeToEntryPointMap = new Map<EventHandlerType, Record<EventLog[]>>();
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
): EventLog[] {
  let record = eventTypeToEntryPointMap.get(eventType);
  if (record == null) {
    record = {
      status: STATUS_PENDING,
      value: createWakeable<EventLog[]>(),
    };

    eventTypeToEntryPointMap.set(eventType, record);

    fetchEventTypeEntryPoints(client, eventType, record);
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

async function fetchEventTypeEntryPoints(
  client: ReplayClientInterface,
  eventType: EventHandlerType,
  record: Record<EventLog[]>
) {
  const entryPoints = await client.runAnalysis<EventLog>({
    effectful: false,
    eventHandlerEntryPoints: [{ eventType }],
    mapper: MAPPER,
  });

  // Pre-cache object previews that came back with our new analysis data.
  // This will avoid us having to turn around and request them again when rendering the logs.
  entryPoints.forEach(entryPoint => preCacheObjects(entryPoint.pauseId, entryPoint.data.objects));

  const eventLogs: EventLog[] = entryPoints.map(entryPoint => ({
    ...entryPoint,
    type: "EventLog",
  }));

  const wakeable = record.value;

  record.status = STATUS_RESOLVED;
  record.value = eventLogs;

  wakeable.resolve(eventLogs);
}

const MAPPER = `
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
