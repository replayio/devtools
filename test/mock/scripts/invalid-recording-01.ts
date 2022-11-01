// Test that trying to access an inaccessible recording shows an appropriate error.

import { Page } from "@recordreplay/playwright";
import { v4 as uuid } from "uuid";

import {
  createGetRecordingMock,
  createGetUserMock,
  createRecordingOwnerUserIdMock,
  createUserSettingsMock,
} from "../src/graphql";
import { basicBindings, basicMessageHandlers } from "../src/handlers";
import { installMockEnvironmentInPage } from "../src/mockEnvironment";
import { devtoolsURL, runTest } from "../src/runTest";

const recordingId = uuid();
const userId = uuid();
const user = { id: userId, uuid: userId };
const graphqlMocks = [
  ...createUserSettingsMock(),
  ...createRecordingOwnerUserIdMock({ recordingId, user }),
  ...createGetRecordingMock({ recordingId, user }),
  ...createGetUserMock({ user }),
];
const messageHandlers = basicMessageHandlers();
const bindings = basicBindings();

runTest("invalidRecordingID", async (page: Page) => {
  await page.goto(devtoolsURL({ id: recordingId }));
  await installMockEnvironmentInPage(page, { graphqlMocks, messageHandlers, bindings });
  await page.textContent("text=Sorry, you don't have permission!");
});
