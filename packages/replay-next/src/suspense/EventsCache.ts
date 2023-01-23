import {
  EventHandlerType,
  ExecutionPoint,
  Frame,
  Location,
  PauseId,
  Object as RecordReplayObject,
} from "@replayio/protocol";
import sumBy from 'lodash/sumBy';
import isEmpty from 'lodash/isEmpty';
import without from 'lodash/without';

import { assert } from "protocol/utils";
import { ThreadFront } from 'protocol/thread';
import { RecordingTarget } from 'protocol/thread/thread';

import { ReplayClientInterface } from "shared/client/types";

import {
  STANDARD_EVENT_CATEGORIES,
  EventCategory
} from "../constants";
import { groupEntries } from '../utils/group';
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

type EventCategoriesByEvent = Record<string, string>;
type EventCategoriesByEventAndTarget = Record<string, Record<string, string>>;

let recordingTarget: RecordingTarget | null = null;
let eventTypeToEntryPointMap = new Map<EventHandlerType, WakeableRecord<EventLog[]>>();
let eventCategoryCounts: EventCategoryWithCount[] | null = null;
let inProgressEventCategoryCountsWakeable: Wakeable<EventCategoryWithCount[]> | null = null;

/**
 * Encode a Chromium event type, based on its category and non-unique event type.
 */
function makeChromiumEventType(category: string, eventTypeRaw?: string) {
  return `${category}.${eventTypeRaw}`;
}


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

  const result = targetCountEvents(eventCountsRaw);

  if (process.env.NODE_ENV !== "production") {
    // make sure that target counts add up to raw counts
    const targetCount = sumBy(result.flatMap(category => sumBy(category.events, event => event.count || 0)));
    const rawCount = sumBy(Object.values(eventCountsRaw));
    assert(targetCount === rawCount, `Event count: ${targetCount} != ${rawCount}`);
  }

  return result;
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
        events: category.events.map(event => ({
          ...event,
          count: eventCountsRaw[event.type],
        })),
      };
    });
  },
  chromium(eventCountsRaw: Record<string, number>) {
    const eventTable = STANDARD_EVENT_CATEGORIES.chromium!;

    // Merge non-unique CDT category names.
    // NOTE: at this point, we don't care about eventTargets.
    const normalizedEventTable = groupEntries(
      eventTable.map(({ category, events }) => [category, events])
    )
      .map(([ category, events ]) => ({ category, events }));

    // convert, map and merge event types
    // const normalizedEventCounts = convertChromiumEventCounts(eventCountsRaw);
    const chromiumEventCategoriesByEventDefault = makeChromiumEventCategoriesByEventDefault();
    const chromiumEventCategoriesByEventAndTarget = makeChromiumEventCategoriesByEventAndTarget();
    const normalizedEventCounts: { [key: string]: number } = {};
    Object.entries(eventCountsRaw).forEach(
      ([eventInputRaw, count]) => {
        const [eventTypeRaw, eventTargetName] = eventInputRaw.split(',', 2);
        const category = lookupChromiumEventCategory(
          eventTypeRaw, eventTargetName,
          chromiumEventCategoriesByEventDefault,
          chromiumEventCategoriesByEventAndTarget
        );
        const uniqueEventType = makeChromiumEventType(category, eventTypeRaw);
        if (uniqueEventType) {
          normalizedEventCounts[uniqueEventType] = (normalizedEventCounts[uniqueEventType] || 0) + count;
        }
      }
    );
    
    // produce eventTable with counts
    return normalizedEventTable.map(category => {
      return {
        ...category,
        events: category.events.map(event => {
          const count = normalizedEventCounts[makeChromiumEventType(category.category, event.type)];
          return {
            ...event,
            count,
          };
        }),
      };
    });
  }
};

/**
 * Convert event count EntryTypes to unique EntryType and merge all which map to the same type.
 */


/**
 * Find category for raw chromium event input string.
 * 
 * NOTE: Chromium event names are more involved than gecko, because its event names 
 * are not unique. Instead, it uses both: event name + event target name
 * to look up the "breakpoint".
 *
 * NOTE: Event names are produced in ReplayMakeEventType() in chromium in
 *   third_party/blink/renderer/core/inspector/inspector_dom_debugger_agent.cc.
 */
function lookupChromiumEventCategory(
  eventTypeRaw: string, eventTargetName: string,
  chromiumEventCategoriesByEventDefault: EventCategoriesByEvent,
  chromiumEventCategoriesByEventAndTarget: EventCategoriesByEventAndTarget
) {
  // look up category
  let category: string = '';
  if (eventTargetName) {
    // 1. try to look up by targetName
    category = chromiumEventCategoriesByEventAndTarget[eventTypeRaw]?.[eventTargetName];
  }
  if (!category) {
    // 2. try to look up default
    category = chromiumEventCategoriesByEventDefault[eventTypeRaw];
  }
  return category;
};


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
  // TODO: add checks to make sure that each type only has one "default category"
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
 *   click: {
 *     pointerevent: 'mouse'
 *   }
 *   // ... 100+ more entries ...
 * })
 */
function makeChromiumEventCategoriesByEventAndTarget(): EventCategoriesByEventAndTarget {
  const nonUniqueEntries = STANDARD_EVENT_CATEGORIES.chromium!
    .flatMap(category => {
      const eventTargets = category.eventTargets && without(category.eventTargets, '*');
      if (!eventTargets?.length) {
        return null;
      }
      return category.events.map(evt =>
        [
          evt.type,
          eventTargets.map(target => [target.toLowerCase(), category.category])
        ] as [string, [string, string][]]
      );
    })
    .filter(Boolean) as [string, [string, string][]][];

  const uniqueEntries = groupEntries(nonUniqueEntries);
  return Object.fromEntries(
    uniqueEntries.map(([eventType, targetCategoryEntries]) => {
      return [eventType, Object.fromEntries(targetCategoryEntries)] as [string, Record<string, string>];
    })
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



