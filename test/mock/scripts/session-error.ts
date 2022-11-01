// Test getting a session error on startup.

import { Page } from "@recordreplay/playwright";
import { v4 as uuid } from "uuid";

import {
  createGetRecordingMock,
  createGetUserMock,
  createRecordingOwnerUserIdMock,
  createUserSettingsMock,
} from "../src/graphql";
import { basicBindings, basicMessageHandlers } from "../src/handlers";
import { MockHandlerHelpers, installMockEnvironmentInPage } from "../src/mockEnvironment";
import { devtoolsURL, runTest } from "../src/runTest";

const recordingId = uuid();
const userId = uuid();
const user = { id: userId, uuid: userId };
const graphqlMocks = [
  ...createUserSettingsMock(),
  ...createRecordingOwnerUserIdMock({ recordingId, user }),
  ...createGetRecordingMock({ recording: {}, recordingId, user }),
  ...createGetUserMock({ user }),
];
const messageHandlers = {
  ...basicMessageHandlers(),
  "Recording.createSession": (params: any, h: MockHandlerHelpers) => {
    const sessionId = "mock-test-session";
    setTimeout(() => {
      h.emitEvent("Recording.sessionError", {
        sessionId,
        code: 1,
        message: "Session died unexpectedly",
      });
    }, 2000);
    return { sessionId };
  },
};
const bindings = basicBindings();

// Test that getting a session error while loading a replay shows an appropriate error.
runTest("sessionError", async (page: Page) => {
  await page.goto(devtoolsURL({ id: recordingId }));
  await installMockEnvironmentInPage(page, { graphqlMocks, messageHandlers, bindings });
  await page.textContent("text=Something went wrong while replaying");
});
