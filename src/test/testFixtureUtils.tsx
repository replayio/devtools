import { readFileSync } from "fs";
import { gql } from "@apollo/client";

import { ThreadFront } from "protocol/thread";
import { Recording } from "shared/graphql/types";
import { LoadedRegionsTuple, MessageTuple, SourceTuple } from "shared/utils/testing";
import { UIStore } from "ui/actions";
import { convertRecording } from "ui/hooks/recordings";
import { getMockEnvironmentForTesting } from "ui/utils/environment";

import { createTestStore } from "./testUtils";

export const DEFAULT_SESSION_ID = "fake-session-id";

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
  await ThreadFront.setSessionId(sessionId, {});

  // Initialize state using exported websocket messages,
  // sent through the mock environment straight to socket parsing.
  const mockEnvironment = await getMockEnvironmentForTesting();
  replayFixtureData.forEach((message: any) => {
    mockEnvironment.sendSocketMessage(JSON.stringify(message));
  });

  // Give everything time to settle
  await new Promise(resolve => setTimeout(resolve, 100));

  return { graphqlMocks, recording, sessionId, store };
}

type Tuple = LoadedRegionsTuple | MessageTuple | SourceTuple;

export async function sendValuesToMockEnvironment(...values: Array<Tuple>) {
  const mockEnvironment = await getMockEnvironmentForTesting();

  values.forEach(([method, value]) => {
    switch (method) {
      case "Session.loadedRegions":
        mockEnvironment.sendSocketMessage(
          JSON.stringify({
            method,
            params: value,
            sessionId: DEFAULT_SESSION_ID,
          })
        );
        break;
      case "Console.newMessage":
        mockEnvironment.sendSocketMessage(
          JSON.stringify({
            method,
            params: { message: value },
            sessionId: DEFAULT_SESSION_ID,
          })
        );
        break;
      case "Debugger.newSource":
        mockEnvironment.sendSocketMessage(
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
