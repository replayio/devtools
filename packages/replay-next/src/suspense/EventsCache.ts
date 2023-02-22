import { PointRange } from "@replayio/protocol";
import {
  EventHandlerType,
  ExecutionPoint,
  Frame,
  Location,
  PauseData,
  PauseId,
  Value as ProtocolValue,
  Object as RecordReplayObject,
} from "@replayio/protocol";

import { AnalysisInput, SendCommand, getFunctionBody } from "protocol/evaluation-utils";
import { ReplayClientInterface } from "shared/client/types";

import { STANDARD_EVENT_CATEGORIES } from "../constants";
import { createWakeable } from "../utils/suspense";
import { createGenericCache } from "./createGenericCache";
import { cachePauseData } from "./PauseCache";
import { Record, STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED, Wakeable } from "./types";

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
    objects: RecordReplayObject[];
  };
  location: Location[];
  pauseId: PauseId;
  point: ExecutionPoint;
  time: number;
  type: "EventLog";
  values: ProtocolValue[];
};

export const {
  getValueSuspense: getEventCategoryCountsSuspense,
  getValueAsync: getEventCategoryCountsAsync,
  getValueIfCached: getEventCategoryCountsIfCached,
} = createGenericCache<
  [client: ReplayClientInterface],
  [range: PointRange | null],
  EventCategory[]
>(
  "getEventCategoryCounts",
  async (range, client) => {
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
  range => (range ? `${range.begin}:${range.end}` : "")
);

let eventTypeToEntryPointMap = new Map<EventHandlerType, Record<EventLog[]>>();

export function getEventTypeEntryPointsSuspense(
  client: ReplayClientInterface,
  eventType: EventHandlerType
): EventLog[] {
  let record = eventTypeToEntryPointMap.get(eventType);
  if (record == null) {
    record = {
      status: STATUS_PENDING,
      value: createWakeable<EventLog[]>("getEventTypeEntryPointsSuspense"),
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

async function fetchEventTypeEntryPoints(
  client: ReplayClientInterface,
  eventType: EventHandlerType,
  record: Record<EventLog[]>
) {
  const wakeable = record.value;
  try {
    const entryPoints = await client.runAnalysis<EventLog>({
      effectful: false,
      eventHandlerEntryPoints: [{ eventType }],
      mapper: getFunctionBody(eventsMapper),
    });

    // Pre-cache object previews that came back with our new analysis data.
    // This will avoid us having to turn around and request them again when rendering the logs.
    entryPoints.forEach(entryPoint => cachePauseData(client, entryPoint.pauseId, entryPoint.data));

    const eventLogs: EventLog[] = entryPoints.map(entryPoint => ({
      ...entryPoint,
      type: "EventLog",
    }));

    record.status = STATUS_RESOLVED;
    record.value = eventLogs;
  } catch (err) {
    // Handle any analysis errors (such as "too many hits found") by resolving the record with
    // a dummy `EventLog` entry that will get shown as a single console message at the top of
    // the list.  That way we at least communicate to the user what happened.
    // TODO [FE-1257] Show a better indicator that there were too many events found, like an overlay.
    record.status = STATUS_RESOLVED;
    record.value = [
      {
        data: {
          frames: [],
          objects: [],
        },
        location: [],
        pauseId: "",
        point: "",
        time: 0,
        type: "EventLog",
        values: [
          {
            value: `❗Too many messages of type "${eventType}" found!`,
          },
        ],
      },
    ];
  } finally {
    wakeable.resolve(record.value);
  }
}

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
