import {
  EventHandlerType,
  ExecutionPoint,
  Frame,
  Location,
  PauseId,
  Object as RecordReplayObject,
} from "@replayio/protocol";
import isEmpty from 'lodash/isEmpty';
import sum from 'lodash/sum';
import { ThreadFront } from 'protocol/thread';
import { RecordingTarget } from 'protocol/thread/thread';

import { ReplayClientInterface } from "shared/client/types";

import {
  STANDARD_EVENT_CATEGORIES,
  EventCategory,
  ChromiumEventCategoriesByEventDefault,
  ChromiumEventCategoriesByEventAndTarget
} from "../constants";
import { createWakeable } from "../utils/suspense";
import { cachePauseData } from "./PauseCache";
import { Record as WakeableRecord, STATUS_PENDING, STATUS_RESOLVED, Wakeable } from "./types";

export type EventCounter = {
  count: number;
  label: string;
  type: EventHandlerType;
};

export type EventCategoryWithCount = {
  category: string;
  events: EventCounter[];
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
  values: any[];
};

let recordingTarget: RecordingTarget | null = null;
let eventTypeToEntryPointMap = new Map<EventHandlerType, WakeableRecord<EventLog[]>>();
let eventCategoryCounts: EventCategoryWithCount[] | null = null;
let inProgressEventCategoryCountsWakeable: Wakeable<EventCategoryWithCount[]> | null = null;

export function getEventCategoryCountsSuspense(client: ReplayClientInterface): EventCategoryWithCount[] {
  if (eventCategoryCounts !== null) {
    return eventCategoryCounts;
  }

  if (inProgressEventCategoryCountsWakeable === null) {
    inProgressEventCategoryCountsWakeable = createWakeable<EventCategoryWithCount[]>(
      "getEventCategoryCountsSuspense"
    );

    fetchEventCategoryCounts(client);
  }

  throw inProgressEventCategoryCountsWakeable;
}

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

async function fetchEventCategoryCounts(client: ReplayClientInterface) {
  const pendingEventCategoryCounts: EventCategoryWithCount[] = [];

  const eventCountsRaw = await client.getAllEventHandlerCounts();
  eventCategoryCounts = await countEvents(eventCountsRaw);

  inProgressEventCategoryCountsWakeable!.resolve(pendingEventCategoryCounts);
  inProgressEventCategoryCountsWakeable = null;
}

async function fetchEventTypeEntryPoints(
  client: ReplayClientInterface,
  eventType: EventHandlerType,
  record: WakeableRecord<EventLog[]>
) {
  const entryPoints = await client.runAnalysis<EventLog>({
    effectful: false,
    eventHandlerEntryPoints: [{ eventType }],
    mapper: MAPPER,
  });

  // Pre-cache object previews that came back with our new analysis data.
  // This will avoid us having to turn around and request them again when rendering the logs.
  entryPoints.forEach(entryPoint => cachePauseData(client, entryPoint.pauseId, entryPoint.data));

  const eventLogs: EventLog[] = entryPoints.map(entryPoint => ({
    ...entryPoint,
    type: "EventLog",
  }));

  const wakeable = record.value;

  record.status = STATUS_RESOLVED;
  record.value = eventLogs;

  wakeable.resolve(eventLogs);
}

async function getRecordingTarget() {
  if (recordingTarget === null) {
    recordingTarget = await ThreadFront.getRecordingTarget();
  }
  return recordingTarget;
}

async function countEvents(eventCountsRaw: Record<string, number>) {
  const recordingTarget = await getRecordingTarget();
  const targetCountEvents = CountEvents[recordingTarget];
  if (!targetCountEvents) {
    if (!isEmpty(eventCountsRaw)) {
      console.error(`recordingTarget "${recordingTarget}" has events but is missing CountEvents function`);
    }
    return [];
  }
  return targetCountEvents(eventCountsRaw);
}

type CountEventsFunction = (
  eventCountsRaw: Record<string, number>
) => EventCategoryWithCount[];

const CountEvents: Partial<Record<RecordingTarget, CountEventsFunction>> = {
  gecko(eventCountsRaw: Record<string, number>) {
    const eventTable = STANDARD_EVENT_CATEGORIES.gecko!;
    return eventTable.map(category => {
      return {
        ...category,
        events: category.events.map(eventType => ({
          ...eventType,
          count: eventCountsRaw[eventType.type],
        })),
      };
    });
  },
  chromium(eventCountsRaw: Record<string, number>) {
    const eventTable = STANDARD_EVENT_CATEGORIES.chromium!;
    eventCountsRaw = ChromiumConvertEventCounts(eventCountsRaw);
    return eventTable.map(category => {
      return {
        ...category,
        events: category.events.map(eventType => ({
          ...eventType,
          count: eventCountsRaw[eventType.type],
        })),
      };
    });
  }
};

/**
 * Take the non-sensical event information emitted by chromium and convert to a
 * normalized format.
 */
function ChromiumConvertEventCounts(eventCountsRaw: Record<string, number>) {
  const converted: { [key: string]: number } = {};
  Object.entries(eventCountsRaw)
    .map(
      ([eventInputRaw, count]) => {
        const uniqueEventName = MakeChromiumUniqueEventName(eventInputRaw);
        if (uniqueEventName) {
          converted[uniqueEventName] = (converted[uniqueEventName] || 0) + count;
        }
      }
    );
  return converted;
}

/**
 * Chromium is more involved than gecko, because its event names 
 * are not unique. Instead, it uses both: event name + event target name
 * to look up the "breakpoint".
 *
 * NOTE: Event names are produced in ReplayMakeEventName() in chromium in
 *   third_party/blink/renderer/core/inspector/inspector_dom_debugger_agent.cc.
 */
function MakeChromiumUniqueEventName(eventInputRaw: string) {
  const [eventNameRaw, eventTargetName] = eventInputRaw.split(',', 2);

  // look up category
  let category: string = '';
  if (eventTargetName) {
    // first try to look up by targetName
    category = ChromiumEventCategoriesByEventAndTarget[eventNameRaw]?.[eventTargetName];
  }
  if (!category) {
    // try to look up default
    category = ChromiumEventCategoriesByEventDefault[eventNameRaw];
  }
  return MakeChromiumEventName(category, eventNameRaw);
};

function MakeChromiumEventName(category: string, eventNameRaw: string) {
  return `${category}.${eventNameRaw}`;
}


/**
 * Mapper JS string that will be executed inside a VM on the backend
 * on inidividual analysis results.
 */
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



