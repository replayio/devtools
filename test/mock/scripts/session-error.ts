// Test getting a session error on startup.

import { Page } from "@recordreplay/playwright";
import { v4 as uuid } from "uuid";

import {
  createRecordingOwnerUserIdMock,
  createUserSettingsMock,
  createGetUserMock,
  createGetRecordingMock,
} from "../src/graphql";
import { basicMessageHandlers, basicBindings } from "../src/handlers";
import { installMockEnvironment, MockHandlerHelpers } from "../src/mockEnvironment";
import { runTest, devtoolsURL } from "../src/runTest";

const recordingId = uuid();
const userId = uuid();
const user = { id: userId, uuid: userId };
const graphqlMocks = [
  ...createUserSettingsMock(),
  ...createRecordingOwnerUserIdMock({ recordingId, user }),
  ...createGetRecordingMock({ recording: {}, recordingId }),
  ...createGetUserMock({ user }),
];
const messageHandlers = {
  ...basicMessageHandlers(),
  "Recording.createSession": (params: any, h: MockHandlerHelpers) => {
    const sessionId = "mock-test-session";
    setTimeout(() => {
      h.emitEvent("Recording.sessionError", {
        code: 1,
        message: "Session died unexpectedly",
        sessionId,
      });
    }, 2000);
    return { sessionId };
  },
};
const bindings = basicBindings();

// Test that getting a session error while loading a replay shows an appropriate error.
runTest("sessionError", async (page: Page) => {
  await page.goto(devtoolsURL({ id: recordingId }));
  await installMockEnvironment(page, { bindings, graphqlMocks, messageHandlers });
  await page.textContent("text=Something went wrong while replaying");
});
