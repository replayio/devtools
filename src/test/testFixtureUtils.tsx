import { readFileSync } from "fs";
import { join } from "path";

import type {
  CallStack,
  loadedRegions,
  Location,
  MappedLocation,
  Message,
  MessageLevel,
  MessageSource,
  newSource,
  ObjectId,
  PauseData,
  PauseId,
  PointDescription,
  SourceId,
  SourceKind,
  TimeStampedPoint,
  TimeStampedPointRange,
  Value,
} from "@recordreplay/protocol";
import { ThreadFront } from "protocol/thread";
import { UIStore } from "ui/actions";

import { createTestStore } from "./testUtils";

export const DEFAULT_SOURCE_ID = "fake-source-id";
export const DEFAULT_SESSION_ID = "fake-session-id";

let uidCounter = 0;

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
}): Message {
  return {
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
}

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
}): loadedRegions {
  const timeRange: TimeStampedPointRange = {
    begin: createTimeStampedPoint({ point: beginPoint, time: beginTime }),
    end: createTimeStampedPoint({ point: endPoint, time: endTime }),
  };

  return {
    indexed: isIndexed ? [timeRange] : [],
    loaded: isLoaded ? [timeRange] : [],
    loading: [timeRange],
  };
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

export function createSource({
  generatedSourceIds,
  kind,
  sourceId = DEFAULT_SOURCE_ID,
  url,
}: {
  generatedSourceIds?: SourceId[];
  kind: SourceKind;
  sourceId?: SourceId;
  url?: string;
}): newSource {
  return {
    generatedSourceIds,
    kind,
    sourceId,
    url,
  };
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

export async function loadFixtureData(testName: string): Promise<UIStore> {
  const fixtureData = JSON.parse(
    readFileSync(join(__dirname, "..", "..", "test", "fixtures", `${testName}.json`), "utf8")
  );

  const sessionId = fixtureData.find((message: any) => {
    if (message.hasOwnProperty("sessionId")) {
      return message.sessionId;
    }
  });

  if (!sessionId) {
    console.warn("Fixture does not contain a session ID");
  }

  // TODO This is side effectful in a way that affects ThreadFront.setSessionId(); we should clean that up!
  const store = await createTestStore();

  // This is necessary to unblock various event listeners and parsing.
  // Actual session ID value _probably_ doesn't matter here.
  await ThreadFront.setSessionId(sessionId);

  // Initialize state using exported websocket messages,
  // sent through the mock environment straight to socket parsing.
  fixtureData.forEach((message: any) => {
    window.mockEnvironment?.sendSocketMessage(JSON.stringify(message));
  });

  // Give everything time to settle
  await new Promise(resolve => setTimeout(resolve, 100));

  return store;
}

export function sendLoadedRegionsToMockEnvironment(value: loadedRegions): void {
  window.mockEnvironment?.sendSocketMessage(
    JSON.stringify({
      method: "Session.loadedRegions",
      params: value,
      sessionId: DEFAULT_SESSION_ID,
    })
  );
}

export function sendMessageToMockEnvironment(value: Message): void {
  window.mockEnvironment?.sendSocketMessage(
    JSON.stringify({
      method: "Console.newMessage",
      params: {
        message: value,
        sessionId: DEFAULT_SESSION_ID,
      },
    })
  );
}

export function sendSourceToMockEnvironment(value: newSource): void {
  window.mockEnvironment?.sendSocketMessage(
    JSON.stringify({
      method: "Debugger.newSource",
      params: value,
      sessionId: DEFAULT_SESSION_ID,
    })
  );
}
