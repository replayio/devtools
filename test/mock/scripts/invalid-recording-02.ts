// Test that specifying an invalid recordingId shows an appropriate error.

import { Page } from "@recordreplay/playwright";
import { v4 as uuid } from "uuid";

import { createGetUserMock, createUserSettingsMock, createGetRecordingMock } from "../src/graphql";
import { basicMessageHandlers, basicBindings } from "../src/handlers";
import { installMockEnvironment } from "../src/mockEnvironment";
import { runTest, devtoolsURL } from "../src/runTest";

const recordingId = "foobar";
const userId = uuid();
const user = { id: userId, uuid: userId };
const graphqlMocks = [
  ...createUserSettingsMock(),
  ...createGetUserMock({ user }),
  ...createGetRecordingMock({ recordingId }),
];
const messageHandlers = basicMessageHandlers();
const bindings = basicBindings();

runTest("invalidRecordingID", async (page: Page) => {
  await page.goto(devtoolsURL({ id: recordingId }));
  await installMockEnvironment(page, { bindings, graphqlMocks, messageHandlers });
  await page.textContent('text="foobar" is not a valid recording ID');
});
