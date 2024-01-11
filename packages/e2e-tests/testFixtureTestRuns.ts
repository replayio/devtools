import crypto from "crypto";
import { Page, test as base } from "@playwright/test";
import axios from "axios";

import { setupTestRun, testRunStates } from "./helpers/testRunsFixtureSetup";

type TestRunSetupFixture = {
  testRunState: keyof typeof testRunStates;
  pageWithMeta: {
    page: Page;
    clientKey: string;
    testRunId: string;
  };
};

const testWithTestRunSetup = base.extend<TestRunSetupFixture>({
  testRunState: undefined,
  pageWithMeta: async ({ page, testRunState }, use) => {
    if (!testRunStates[testRunState]) {
      throw new Error("Invalid test run state");
    }

    const testRunClientKey = crypto.randomUUID();
    try {
      const testRunId = await setupTestRun(testRunState, testRunClientKey);
      await use({ page, clientKey: testRunClientKey, testRunId });
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        console.error("Axios error setting up test run: ", {
          errors: err.response?.data?.errors,
          details: err.toJSON(),
        });
      } else {
        console.error("Error setting up test run: ", err);
      }
      throw err;
    }
  },
});
export default testWithTestRunSetup;
export { testWithTestRunSetup as test };
export { expect } from "@playwright/test";
export type { Page } from "@playwright/test";
