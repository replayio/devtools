// Test loading an invalid or unauthorized recording ID.

import { runTest, devtoolsURL } from "../src/runTest";
import { installMockEnvironment } from "../src/mockEnvironment";
import { v4 as uuid } from "uuid";
import {
  createRecordingIsInitializedMock,
  createRecordingOwnerUserIdMock,
  createGetRecordingMock,
  createUserSettingsMock,
} from "../src/graphql";
import { Page } from "@recordreplay/playwright";

/*
// Test that using a recording ID that isn't a valid UUID shows an appropriate error.
runTest("notUUID", async page => {
  await page.goto(devtoolsURL({ id: "foobar" }));
  await new Promise(resolve => setTimeout(resolve, 2000));
});
*/

const recordingId = uuid();
const userId = uuid();
const graphqlMocks = [
  createUserSettingsMock(),
  createRecordingIsInitializedMock({ recordingId, isInitialized: true }),
  createRecordingOwnerUserIdMock({ recordingId, user: { id: userId, uuid: userId } }),
  createGetRecordingMock({ recordingId }),
];

// Test that getting an invalid recording ID error from the backend shows an appropriate error.
runTest("invalidRecordingID", async (page: Page) => {
  await page.goto(devtoolsURL({ id: recordingId }));
  await installMockEnvironment(page, { graphqlMocks });
  await page.textContent("text=You don't have permission to view this replay");
});
