import {
  EventHandlerType,
  ExecutionPoint,
  Frame,
  Location,
  PauseId,
  Object as RecordReplayObject,
} from "@replayio/protocol";
import isEmpty from 'lodash/isEmpty';
import without from 'lodash/without';
import { ThreadFront } from 'protocol/thread';
import { RecordingTarget } from 'protocol/thread/thread';

import { ReplayClientInterface } from "shared/client/types";

import {
  STANDARD_EVENT_CATEGORIES,
  EventCategory
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
    const eventCountsConverted = convertChromiumEventCounts(eventCountsRaw);
    return eventTable.map(category => {
      return {
        ...category,
        events: category.events.map(eventType => ({
          ...eventType,
          count: eventCountsConverted[eventType.type],
        })),
      };
    });
  }
};

/**
 * Convert event count entries to unique name and merge all which map to the same name.
 */
function convertChromiumEventCounts(eventCountsRaw: Record<string, number>) {
  const converted: { [key: string]: number } = {};
  const chromiumEventCategoriesByEventDefault = makeChromiumEventCategoriesByEventDefault();
  const chromiumEventCategoriesByEventAndTarget = makeChromiumEventCategoriesByEventAndTarget();
  Object.entries(eventCountsRaw)
    .map(
      ([eventInputRaw, count]) => {
        const uniqueEventName = makeChromiumUniqueEventName(
          eventInputRaw,
          chromiumEventCategoriesByEventDefault,
          chromiumEventCategoriesByEventAndTarget
        );
        if (uniqueEventName) {
          converted[uniqueEventName] = (converted[uniqueEventName] || 0) + count;
        }
      }
    );
  return converted;
}


/**
 * Convert event strings produced by chromium to unique event names.
 * 
 * NOTE: Chromium event names are more involved than gecko, because its event names 
 * are not unique. Instead, it uses both: event name + event target name
 * to look up the "breakpoint".
 *
 * NOTE: Event names are produced in ReplayMakeEventName() in chromium in
 *   third_party/blink/renderer/core/inspector/inspector_dom_debugger_agent.cc.
 */
function makeChromiumUniqueEventName(
  eventInputRaw: string,
  chromiumEventCategoriesByEventDefault: EventCategoriesByEvent,
  chromiumEventCategoriesByEventAndTarget: EventCategoriesByEventAndTarget
) {
  const [eventNameRaw, eventTargetName] = eventInputRaw.split(',', 2);

  // look up category
  let category: string = '';
  if (eventTargetName) {
    // first try to look up by targetName
    category = chromiumEventCategoriesByEventAndTarget[eventNameRaw]?.[eventTargetName];
  }
  if (!category) {
    // try to look up default
    category = chromiumEventCategoriesByEventDefault[eventNameRaw];
  }
  return MakeChromiumEventName(category, eventNameRaw);
};

function MakeChromiumEventName(category: string, eventNameRaw: string) {
  return `${category}.${eventNameRaw}`;
}


type EventCategoriesByEvent = Record<string, string>;
type EventCategoriesByEventAndTarget = Record<string, Record<string, string>>;

/**
 * This allows looking up category by non-unique event name
 * for all events that have a '*' target (or no target at all).
 * 
 * @example
 * ({
 *   load: 'load',
 *   click: 'mouse',
 *   // ... 100+ more entries ...
 * })
 * 
 */
function makeChromiumEventCategoriesByEventDefault(): EventCategoriesByEvent {
  return Object.fromEntries(
    STANDARD_EVENT_CATEGORIES.chromium!
      .flatMap(category => {
        if (!category.eventTargets || category.eventTargets.includes('*')) {
          return category.events.map(evt => [
            evt.type, category.category
          ]);
        }
        return null;
      })
      .filter(Boolean) as [[string, string]]
  );
}

/**
 * This allows looking up category by (1) non-unique event name -> (2) EventTarget name.
 * 
 * @example 
 * ({
 *   load: {
 *     xmlhttprequest: 'XHR',
 *     xmlhttprequestupload: 'XHR',
 *   },
 *   click: { // or maybe `click: 'mouse'` for short, since it only has a default
 *   }
 *   // ... 100+ more entries ...
 * })
 */
function makeChromiumEventCategoriesByEventAndTarget(): EventCategoriesByEventAndTarget {
  return Object.fromEntries(
    STANDARD_EVENT_CATEGORIES.chromium!
      .flatMap(category => {
        const eventTargets = category.eventTargets && without(category.eventTargets, '*');
        if (!eventTargets?.length) {
          return null;
        }
        return category.events.map(evt =>
          [
            evt.type,
            Object.fromEntries(eventTargets.map(target => [target, category.category]))
          ]
        ) as [[string, Record<string, string>]];
      })
      .filter(Boolean) as [[string, Record<string, string>]]
  );
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



