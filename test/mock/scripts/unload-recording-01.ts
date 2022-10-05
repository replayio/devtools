// Check that unloaded regions in the recording are reflected in the UI.

import { runTest, devtoolsURL } from "../src/runTest";
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

export function waitForTime(ms: number, waitingFor?: string) {
  console.log(`waiting ${ms}ms for ${waitingFor}`);
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isLongTimeout() {
  return new URL(window.location.href).searchParams.get("longTimeout");
}

function defaultWaitTimeout() {
  return 1000 * (isLongTimeout() ? 120 : 10);
}

export async function waitUntil<T>(
  fn: () => T,
  options?: { timeout?: number; waitingFor?: string }
) {
  const { timeout, waitingFor } = {
    timeout: defaultWaitTimeout(),
    waitingFor: "unknown",
    ...options,
  };
  const start = Date.now();
  while (true) {
    const rv = fn();
    if (rv) {
      return rv;
    }
    const elapsed = Date.now() - start;
    if (elapsed >= timeout) {
      break;
    }
    if (elapsed < 1000) {
      await waitForTime(50, waitingFor);
    } else if (elapsed < 5000) {
      await waitForTime(200, waitingFor);
    } else {
      await waitForTime(1000, waitingFor);
    }
  }
  throw new Error(`waitUntil() timed out waiting for ${waitingFor}`);
}

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
