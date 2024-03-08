import crypto from "crypto";
import { Page, test as base } from "@playwright/test";

import exampleRecordings from "./examples.json";
import { TestRecordingKey } from "./helpers";
import { TestUser } from "./helpers/authentication";
import { resetTestUser } from "./helpers/utils";
import { loadRecording } from "./scripts/loadRecording";

type TestIsolatedRecordingFixture = {
  exampleKey: TestRecordingKey;
  testUsers?: TestUser[];
  pageWithMeta: {
    page: Page;
    recordingId: string;
    testScope: string;
  };
};

export { base };

const testWithCloneRecording = base.extend<TestIsolatedRecordingFixture>({
  exampleKey: undefined,
  testUsers: undefined,
  pageWithMeta: async ({ page, exampleKey, testUsers }, use) => {
    if (!exampleRecordings[exampleKey]) {
      throw new Error(`Invalid recording: ${exampleKey}`);
    }

    const testScope = crypto.randomUUID();

    let recordingId = exampleRecordings[exampleKey]?.recording;
    try {
      try {
        await loadRecording(recordingId);
      } catch (e) {
        console.warn("Error processing recording; ignoring.");
      }

      // Start coverage.
      await page.coverage.startJSCoverage({
        resetOnNavigation: false,
      });

      // Run test.
      await use({
        page,
        recordingId: recordingId,
        testScope,
      });
    } finally {
      try {
        await page.coverage.stopJSCoverage();
      } catch (err: any) {
        console.error("Error stopping JS coverage: ", err);
      }

      for (const user of testUsers ?? []) {
        await resetTestUser(user.email, testScope);
      }
    }
  },
});

export default testWithCloneRecording;
export { expect } from "@playwright/test";
export type { Page } from "@playwright/test";
export { testWithCloneRecording as test };
