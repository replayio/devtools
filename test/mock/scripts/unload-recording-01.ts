// Check that unloaded regions in the recording are reflected in the UI.

import { runTest, devtoolsURL } from "../src/runTest";
import { waitUntil } from "../../../src/test/harness";
import { installMockEnvironmentInPage, MockHandlerHelpers } from "../src/mockEnvironment";
import { v4 as uuid } from "uuid";
import {
  createRecordingOwnerUserIdMock,
  createUserSettingsMock,
  createGetUserMock,
  createGetRecordingMock,
  createEmptyCommentsMock,
  createGetActiveSessionsMock,
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
  ...createRecordingOwnerUserIdMock({ recordingId, user }),
  ...createGetUserMock({ user }),
  ...createGetRecordingMock({ recording, recordingId, user }),
  ...createEmptyCommentsMock({ recordingId }),
  ...createGetActiveSessionsMock({ recordingId }),
];
const bindings = {
  ...basicBindings(),
  endpoint: {
    point: "100000",
    time: 100000,
  },
};
const messageHandlers = {
  ...basicMessageHandlers(),
  "Session.listenForLoadChanges": (params: any, h: MockHandlerHelpers) => {
    h.emitEvent("Session.loadedRegions", {
      indexed: [],
      loaded: [
        {
          begin: { point: "50000", time: 50000 },
          end: h.bindings.endpoint,
        },
      ],
      loading: [
        {
          begin: { point: "50000", time: 50000 },
          end: h.bindings.endpoint,
        },
      ],
    });
    return new Promise(resolve => {});
  },
};

runTest("unloadRecording", async (page: Page) => {
  await page.goto(devtoolsURL({ id: recordingId }));
  await installMockEnvironmentInPage(page, { graphqlMocks, messageHandlers, bindings });
  await page.click("text=Devtools");
  await waitUntil(async () => {
    const bar = await page.$(".progress-bar");
    const unloaded = await page.$(".unloaded-regions.start");
    if (bar && unloaded) {
      const barBox = await bar.boundingBox();
      const unloadedBox = await unloaded.boundingBox();
      if (barBox && unloadedBox) {
        return unloadedBox.width >= barBox.width * 0.45;
      }
    }
    return false;
  });
});
