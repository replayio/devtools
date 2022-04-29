import { readFileSync } from "fs";

import { gql } from "@apollo/client";
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
import { convertRecording } from "ui/hooks/recordings";
import { Recording } from "ui/types";

import { createTestStore } from "./testUtils";

export const DEFAULT_SOURCE_ID = "fake-source-id";
export const DEFAULT_SOURCE_URL = "fake-source-url";
export const DEFAULT_SESSION_ID = "fake-session-id";

let uidCounter = 0;

type MessageTuple = ["Console.newMessage", Message];

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
}): MessageTuple {
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

type LoadedRegionsTuple = ["Session.loadedRegions", loadedRegions];

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

type SourceTuple = ["Debugger.newSource", newSource];

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

export async function loadFixtureData(
  testName: string
): Promise<{ graphqlMocks: any[]; recording: Recording; sessionId: string; store: UIStore }> {
  const graphqlMocks: any[] = [];
  const apolloFixtureData = JSON.parse(
    readFileSync(`${__dirname}/../../test/fixtures/${testName}.apollo.json`, "utf8")
  );
  apolloFixtureData.forEach(({ requestData, responseData }: any) => {
    // Strip "__typename" attributes because they interfere with how we configure the MockedProvider.
    requestData.query = requestData.query.replace(/[\r\n]\s+__typename/g, "");

    // Put a few copies of each request/response pair in the mock queue;
    // Apollo removes responses from the queue when they're matched.
    for (let i = 0; i < 5; i++) {
      const mock = {
        request: {
          operationName: requestData.operationName,
          query: gql(requestData.query),
          variables: requestData.variables,
        },
        result: responseData,
      };

      graphqlMocks.push(mock);
    }
  });

  const recordingMock = apolloFixtureData.find((message: any) => {
    return message.requestData.operationName === "GetRecording";
  });
  if (!recordingMock) {
    throw Error("Fixture does not contain a recording");
  }
  const recording: Recording = convertRecording(recordingMock.responseData.data.recording)!;

  const replayFixtureData = JSON.parse(
    readFileSync(`${__dirname}/../../test/fixtures/${testName}.replay.json`, "utf8")
  );

  const session = replayFixtureData.find((message: any) => {
    return message.hasOwnProperty("sessionId");
  });
  if (!session) {
    throw Error("Fixture does not contain a session ID");
  }
  const sessionId = session.sessionId;

  // TODO This is side effectful in a way that affects ThreadFront.setSessionId(); we should clean that up!
  const store = await createTestStore();

  // This is necessary to unblock various event listeners and parsing.
  // Actual session ID value _probably_ doesn't matter here.
  await ThreadFront.setSessionId(sessionId);

  // Initialize state using exported websocket messages,
  // sent through the mock environment straight to socket parsing.
  replayFixtureData.forEach((message: any) => {
    window.mockEnvironment?.sendSocketMessage(JSON.stringify(message));
  });

  // Give everything time to settle
  await new Promise(resolve => setTimeout(resolve, 100));

  return { graphqlMocks, recording, sessionId, store };
}

type Tuple = LoadedRegionsTuple | MessageTuple | SourceTuple;

export function sendValuesToMockEnvironment(...values: Array<Tuple>): void {
  values.forEach(([method, value]) => {
    switch (method) {
      case "Session.loadedRegions":
        window.mockEnvironment?.sendSocketMessage(
          JSON.stringify({
            method,
            params: value,
            sessionId: DEFAULT_SESSION_ID,
          })
        );
        break;
      case "Console.newMessage":
        window.mockEnvironment?.sendSocketMessage(
          JSON.stringify({
            method,
            params: { message: value },
            sessionId: DEFAULT_SESSION_ID,
          })
        );
        break;
      case "Debugger.newSource":
        window.mockEnvironment?.sendSocketMessage(
          JSON.stringify({
            method,
            params: value,
            sessionId: DEFAULT_SESSION_ID,
          })
        );
        break;
      default:
        throw Error(`Unsupported type "${method}"`);
        break;
    }
  });
}
