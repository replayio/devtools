import crypto from "crypto";
import { Page, test as base } from "@playwright/test";
import axios from "axios";
import { addCoverageReport } from "monocart-reporter";

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
      throw new Error("Invalid recording");
    }

    const testScope = crypto.randomUUID();
    let newRecordingId: string | undefined = undefined;
    try {
      const { recording } = exampleRecordings[exampleKey];
      console.log("Cloning recording");
      newRecordingId = await cloneTestRecording(recording);

      try {
        await loadRecording(newRecordingId);
      } catch (e) {
        console.warn("Error processing recording; ignoring.");
      }

      await page.coverage.startJSCoverage({
        resetOnNavigation: false,
      });
      await use({
        page,
        recordingId: newRecordingId,
        testScope,
      });
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        console.error("Axios error cloning recording: ", {
          errors: err.response?.data?.errors,
          details: err.toJSON(),
        });
      } else {
        console.error("Error cloning recording: ", err);
      }
      throw err;
    } finally {
      let jsCoverage: Awaited<ReturnType<Page["coverage"]["stopJSCoverage"]>> | undefined;
      try {
        jsCoverage = await page.coverage.stopJSCoverage();
      } catch (err: any) {
        console.error("Error stopping JS coverage: ", err);
      }

      // A couple of our tests don't use the default page object, like `auth/comments-02`
      // and `auth/logpoints-01`. Handle missing coverage without erroring.
      if (!jsCoverage || Object.keys(jsCoverage).length === 0) {
        console.error("No JS coverage: ", exampleKey);
      } else {
        await addCoverageReport(jsCoverage, base.info());
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
export { testWithCloneRecording as test };
export { expect } from "@playwright/test";
export type { Page } from "@playwright/test";
