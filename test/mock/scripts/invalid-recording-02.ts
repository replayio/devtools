// Test that specifying an invalid recordingId shows an appropriate error.

import { Page } from "@recordreplay/playwright";
import { v4 as uuid } from "uuid";

import { createGetRecordingMock, createGetUserMock, createUserSettingsMock } from "../src/graphql";
import { basicBindings, basicMessageHandlers } from "../src/handlers";
import { installMockEnvironmentInPage } from "../src/mockEnvironment";
import { devtoolsURL, runTest } from "../src/runTest";

const recordingId = "foobar";
const userId = uuid();
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
