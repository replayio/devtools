import { Page, test as base } from "@playwright/test";
import type { AxiosError } from "axios";
import axios from "axios";
import { addCoverageReport } from "monocart-reporter";

import { TestRecordingKey } from "./helpers";
import { cloneTestRecording, deleteTestRecording } from "./helpers/utils";

type TestIsolatedRecordingFixture = {
  exampleKey: TestRecordingKey;
  pageWithMeta: {
    page: Page;
    recordingId: string;
  };
};

const testWithCloneRecording = base.extend<TestIsolatedRecordingFixture>({
  exampleKey: undefined,
  pageWithMeta: async ({ page, exampleKey }, use) => {
    const exampleRecordings = require("./examples.json");
    if (!exampleRecordings[exampleKey]) {
      throw new Error("Invalid recording");
    }

    let newRecordingId: string | undefined = undefined;
    try {
      const { recording } = exampleRecordings[exampleKey];
      newRecordingId = await cloneTestRecording(recording);

      await page.coverage.startJSCoverage({
        resetOnNavigation: false,
      }),
        await use({
          page,
          recordingId: newRecordingId,
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
      const jsCoverage = page.coverage.stopJSCoverage();

      await addCoverageReport(jsCoverage, base.info());
      if (newRecordingId) {
        await deleteTestRecording(newRecordingId);
      }
    }
  },
});
export default testWithCloneRecording;
export { testWithCloneRecording as test };
export { expect } from "@playwright/test";
export type { Page } from "@playwright/test";
