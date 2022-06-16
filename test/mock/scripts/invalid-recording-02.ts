// Test that specifying an invalid recordingId shows an appropriate error.

import { runTest, devtoolsURL } from "../src/runTest";
import { installMockEnvironmentInPage } from "../src/mockEnvironment";
import { v4 as uuidv4 } from "uuid";
import { createGetUserMock, createUserSettingsMock, createGetRecordingMock } from "../src/graphql";
import { basicMessageHandlers, basicBindings } from "../src/handlers";
import { Page } from "@recordreplay/playwright";

const recordingId = "foobar";
const userId = uuidv4();
const user = { id: userId, uuid: userId };
const graphqlMocks = [
  ...createUserSettingsMock(),
  ...createGetUserMock({ user }),
  ...createGetRecordingMock({ recordingId, user }),
];
const messageHandlers = basicMessageHandlers();
const bindings = basicBindings();

runTest("invalidRecordingID", async (page: Page) => {
  await page.goto(devtoolsURL({ id: recordingId }));
  await installMockEnvironmentInPage(page, { graphqlMocks, messageHandlers, bindings });
  await page.textContent('text="foobar" is not a valid recording ID');
});
