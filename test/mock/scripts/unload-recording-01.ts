// Test some behavior in mock tests.

import { runTest, devtoolsURL } from "../src/runTest";
import { installMockEnvironment } from "../src/mockEnvironment";
import { v4 as uuid } from "uuid";
import {
  createRecordingIsInitializedMock,
  createRecordingOwnerUserIdMock,
  createUserSettingsMock,
  createGetUserMock,
  createGetRecordingMock,
} from "../src/graphql";
import { basicMessageHandlers, basicBindings } from "../src/handlers";
import { Page } from "@recordreplay/playwright";

const recordingId = uuid();
const userId = uuid();
const user = { id: userId, uuid: userId };
const recording = {
  id: recordingId,
  url: "http://mock.test",
  title: "Mock Test",
};
const graphqlMocks = [
  ...createUserSettingsMock(),
  createRecordingIsInitializedMock({ recordingId, isInitialized: true }),
  createRecordingOwnerUserIdMock({ recordingId, user }),
  ...createGetUserMock({ user }),
  ...createGetRecordingMock({ recordingId, recording }),
];
const messageHandlers = basicMessageHandlers();
const bindings = basicBindings();

// Test that getting a session error while loading a replay shows an appropriate error.
runTest("unloadRecording", async (page: Page) => {
  await page.goto(devtoolsURL({ id: recordingId }));
  await installMockEnvironment(page, { graphqlMocks, messageHandlers, bindings });
  await new Promise(resolve => setTimeout(resolve, 5000));
});
