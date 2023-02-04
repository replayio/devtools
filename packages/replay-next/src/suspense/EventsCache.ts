import {
  EventHandlerType,
  ExecutionPoint,
  Frame,
  Location,
  PauseData,
  PauseId,
  Object as RecordReplayObject,
} from "@replayio/protocol";
import isEmpty from "lodash/isEmpty";
import size from "lodash/size";
import sumBy from "lodash/sumBy";
import without from "lodash/without";

import { AnalysisInput, SendCommand, getFunctionBody } from "protocol/evaluation-utils";
import { RecordingTarget } from "protocol/thread/thread";
import { ReplayClientInterface } from "shared/client/types";

import { STANDARD_EVENT_CATEGORIES } from "../constants";
import { groupEntries } from "../utils/group";
import { createWakeable } from "../utils/suspense";
import { cachePauseData } from "./PauseCache";
import { STATUS_PENDING, STATUS_RESOLVED, Wakeable, Record as WakeableRecord } from "./types";

export type EventCounter = {
  count: number;
  label: string;
  type: EventHandlerType;
  /**
   * Set of event types sent from the runtime that map to this normalized event entry.
   */
  rawEventTypes: string[];
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
function makeChromiumEventType(nonUniqueEventType: string, category?: string) {
  if (category) {
    return `${category}.${nonUniqueEventType}`;
  }

  // we were not able to match this event type to a pre-defined category
  return nonUniqueEventType;
}

/**
 * NOTE: The `rawEventType` is produced in MakeReplayMakeEventType in chromium's
 *   `InspectorDOMDebuggerAgent`.
 * @see https://github.com/replayio/chromium/blob/509fb5f3c3a587ebef668a631a53eed83acc2f85/third_party/blink/renderer/core/inspector/inspector_dom_debugger_agent.cc#L940
 */
function decodeChromiumEventType(rawEventType: string) {
  const [nonUniqueEventType, eventTargetName] = rawEventType.split(",", 2);
  return [nonUniqueEventType, eventTargetName];
}

export function getEventCategoryCountsSuspense(
  client: ReplayClientInterface
): EventCategoryWithCount[] {
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
    mapper: getFunctionBody(eventsMapper),
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
      console.error(
        `Internal Error: recordingTarget "${recordingTarget}" has events but is missing CountEvents function`
      );
    }
    return [];
  }
  const result = targetCountEvents(eventCountsRaw);
  return result;
}

type CountEventsFunction = (eventCountsRaw: Record<string, number>) => EventCategoryWithCount[];

const CountEvents: Partial<Record<RecordingTarget, CountEventsFunction>> = {
  gecko(eventCountsRaw: Record<string, number>) {
    const eventTable = STANDARD_EVENT_CATEGORIES.gecko!;
    return eventTable.map(category => {
      return {
        ...category,
        events: category.events.map(event => ({
          ...event,
          count: eventCountsRaw[event.type],
          rawEventTypes: [event.type],
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
    ).map(([category, events]) => ({ category, events }));

    // convert, map and merge event types
    // const normalizedEventCounts = convertChromiumEventCounts(eventCountsRaw);
    const chromiumEventCategoriesByEventDefault = makeChromiumEventCategoriesByEventDefault();
    const chromiumEventCategoriesByEventAndTarget = makeChromiumEventCategoriesByEventAndTarget();
    const normalizedEventCounts: {
      [key: string]: {
        count: number;
        rawEventTypes: string[];
      };
    } = {};
    Object.entries(eventCountsRaw).forEach(([eventInputRaw, count]) => {
      const [eventTypeRaw, eventTargetName] = decodeChromiumEventType(eventInputRaw);
      const category = lookupChromiumEventCategory(
        eventTypeRaw,
        eventTargetName,
        chromiumEventCategoriesByEventDefault,
        chromiumEventCategoriesByEventAndTarget
      );

      const uniqueEventType = makeChromiumEventType(eventTypeRaw, category);
      let entry = normalizedEventCounts[uniqueEventType];
      if (!entry) {
        normalizedEventCounts[uniqueEventType] = entry = {
          count: 0,
          rawEventTypes: [],
        };
      }
      entry.count += count;
      entry.rawEventTypes.push(eventInputRaw);
    });

    // produce eventTable with counts
    const result = normalizedEventTable.map(category => {
      return {
        ...category,
        events: category.events.map(event => {
          const type = makeChromiumEventType(event.type, category.category);
          const countEntry = normalizedEventCounts[type];
          delete normalizedEventCounts[type];
          return {
            ...event,
            ...countEntry,
          };
        }),
      };
    });

    if (size(normalizedEventCounts)) {
      // add "unknown" category
      result.push({
        category: "unknown",
        events: Object.entries(normalizedEventCounts).map(([type, countEntry]) => ({
          type,
          label: `${type} (${countEntry.rawEventTypes
            .map(eventInputRaw => {
              const [, eventTargetName] = decodeChromiumEventType(eventInputRaw);
              return eventTargetName;
            })
            .join(", ")})`,
          ...countEntry,
        })),
      });
    }

    return result;
  },
};

/**
 * Find category for raw chromium event input string.
 *
 * NOTE: Chromium event names are more involved than gecko, because its event names
 * are not unique. Instead, it uses both: event name + event target name
 * to look up the "breakpoint".
 */
function lookupChromiumEventCategory(
  eventTypeRaw: string,
  eventTargetName: string,
  chromiumEventCategoriesByEventDefault: EventCategoriesByEvent,
  chromiumEventCategoriesByEventAndTarget: EventCategoriesByEventAndTarget
) {
  // look up category
  let category: string = "";
  if (eventTargetName) {
    // 1. try to look up by targetName
    category = chromiumEventCategoriesByEventAndTarget[eventTypeRaw]?.[eventTargetName];
  }
  if (!category) {
    // 2. try to look up default
    category = chromiumEventCategoriesByEventDefault[eventTypeRaw];
  }
  return category;
}

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
    STANDARD_EVENT_CATEGORIES.chromium!.flatMap(category => {
      if (!category.eventTargets || category.eventTargets.includes("*")) {
        return category.events.map(evt => [evt.type, category.category]);
      }
      return null;
    }).filter(Boolean) as [[string, string]]
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
 *   play: {
 *     video: 'Media',
 *     audio: 'Media'
 *   }
 *   // ... 100+ more entries ...
 * })
 */
function makeChromiumEventCategoriesByEventAndTarget(): EventCategoriesByEventAndTarget {
  const nonUniqueEntries = STANDARD_EVENT_CATEGORIES.chromium!.flatMap(category => {
    const eventTargets = category.eventTargets && without(category.eventTargets, "*");
    if (!eventTargets?.length) {
      return null;
    }
    return category.events.map(
      evt =>
        [evt.type, eventTargets.map(target => [target.toLowerCase(), category.category])] as [
          string,
          [string, string][]
        ]
    );
  }).filter(Boolean) as [string, [string, string][]][];

  const uniqueEntries = groupEntries(nonUniqueEntries);
  return Object.fromEntries(
    uniqueEntries.map(([eventType, targetCategoryEntries]) => {
      return [eventType, Object.fromEntries(targetCategoryEntries)] as [
        string,
        Record<string, string>
      ];
    })
  );
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
