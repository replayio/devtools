import crypto from "crypto";
import { Page, test as base } from "@playwright/test";
import axios from "axios";

import { TestRecordingKey } from "./helpers";
import { TestUser } from "./helpers/authentication";
import { cloneTestRecording, deleteTestRecording, resetTestUser } from "./helpers/utils";
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
    const exampleRecordings = require("./examples.json");
    if (!exampleRecordings[exampleKey]) {
      throw new Error(`Invalid recording: ${exampleKey}`);
    }

    const testScope = crypto.randomUUID();
    let newRecordingId: string | undefined = undefined;
    try {
      try {
        const { recording } = exampleRecordings[exampleKey];
        console.log("Cloning recording");
        newRecordingId = await cloneTestRecording(recording);
      } catch (err: any) {
        if (axios.isAxiosError(err)) {
          console.error("Axios error cloning recording: ", {
            errors: err.response?.data?.errors,
            details: err.toJSON(),
          });
        }
        throw err;
      }

      try {
        await loadRecording(newRecordingId);
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
        recordingId: newRecordingId,
        testScope,
      });
    } finally {
      try {
        await page.coverage.stopJSCoverage();
      } catch (err: any) {
        console.error("Error stopping JS coverage: ", err);
      }

      if (newRecordingId) {
        await deleteTestRecording(newRecordingId);
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
