import type {
  CallStack,
  Location,
  MappedLocation,
  Message,
  MessageLevel,
  MessageSource,
  ObjectId,
  PauseData,
  PauseId,
  PointDescription,
  SourceId,
  SourceKind,
  TimeStampedPoint,
  TimeStampedPointRange,
  Value,
  loadedRegions,
  newSource,
} from "@replayio/protocol";

export const DEFAULT_SOURCE_ID = "fake-source-id";
export const DEFAULT_SOURCE_URL = "fake-source-url";

let uidCounter = 0;

export type MessageTuple = ["Console.newMessage", Message];

export function createConsoleMessage({
  argumentValues = [],
  column = 0,
  data = {},
  level = "info",
  line = 1,
  pauseId = `${uidCounter++}`,
  point = createPointDescription({}),
  source = "ConsoleAPI",
  sourceId,
  stack = [],
  text = "",
  url,
}: {
  argumentValues?: Value[];
  column?: number;
  data?: PauseData;
  level?: MessageLevel;
  line?: number;
  pauseId?: PauseId;
  point?: PointDescription;
  source?: MessageSource;
  sourceId?: SourceId;
  stack?: CallStack;
  text?: string;
  url?: string;
} = {}): MessageTuple {
  const value: Message = {
    argumentValues,
    column,
    data,
    level,
    line,
    pauseId,
    point,
    source,
    sourceId,
    stack,
    text,
    url,
  };

  return ["Console.newMessage", value];
}

export type LoadedRegionsTuple = ["Session.loadedRegions", loadedRegions];

export function createLoadedRegions({
  beginPoint,
  beginTime = 0,
  endPoint,
  endTime,
  isIndexed = true,
  isLoaded = true,
}: {
  beginPoint?: string;
  beginTime?: number;
  endPoint?: string;
  endTime: number;
  isIndexed?: boolean;
  isLoaded?: boolean;
}): LoadedRegionsTuple {
  const timeRange: TimeStampedPointRange = {
    begin: createTimeStampedPoint({ point: beginPoint, time: beginTime }),
    end: createTimeStampedPoint({ point: endPoint, time: endTime }),
  };

  const value: loadedRegions = {
    indexed: isIndexed ? [timeRange] : [],
    loaded: isLoaded ? [timeRange] : [],
    loading: [timeRange],
  };

  return ["Session.loadedRegions", value];
}

export function createLocation({
  column = 0,
  line = 0,
  sourceId = DEFAULT_SOURCE_ID,
}: {
  column?: number;
  line?: number;
  sourceId?: SourceId;
}): Location {
  return { column, line, sourceId };
}

export function createPointDescription({
  frame = [createLocation({})],
  point,
  time = 0,
}: {
  frame?: MappedLocation;
  point?: string;
  time?: number;
}): PointDescription {
  return { frame, point: point || `${time}`, time };
}

export type SourceTuple = ["Debugger.newSource", newSource];

export function createSource({
  generatedSourceIds,
  kind,
  sourceId = DEFAULT_SOURCE_ID,
  url = DEFAULT_SOURCE_URL,
}: {
  generatedSourceIds?: SourceId[];
  kind: SourceKind;
  sourceId?: SourceId;
  url?: string;
}): SourceTuple {
  const value: newSource = {
    contentId: sourceId,
    generatedSourceIds,
    kind,
    sourceId,
    url,
  };

  return ["Debugger.newSource", value];
}

export function createTimeStampedPoint({
  point,
  time = 0,
}: {
  point?: string;
  time?: number;
}): TimeStampedPoint {
  return { point: point || `${time}`, time };
}

export function createValue({
  bigint,
  object,
  symbol,
  unavailable,
  uninitialized,
  unserializableNumber,
  value,
}: {
  bigint?: string;
  object?: ObjectId;
  symbol?: string;
  unavailable?: boolean;
  uninitialized?: boolean;
  unserializableNumber?: string;
  value?: any;
}): Value {
  return {
    bigint,
    object,
    symbol,
    unavailable,
    uninitialized,
    unserializableNumber,
    value,
  };
}
