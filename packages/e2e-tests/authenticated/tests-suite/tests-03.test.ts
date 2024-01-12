import {
  TEST_RUN_WORKSPACE_API_KEY,
  TEST_RUN_WORKSPACE_TEAM_ID,
} from "../../helpers/authentication";
import test, { expect } from "../../testFixtureTestRuns";
import { startTest, testsItems, waitForTestExecutions } from "./test-suite.utils";

test.use({ testRunState: "UNIQUE_TESTS_FOR_TESTS_VIEW" });

test(`authenticated/new-test-suites/tests-03: test ID in the URL`, async ({
  pageWithMeta: { page, testRunId },
}) => {
  await startTest(
    page,
    TEST_RUN_WORKSPACE_API_KEY,
    TEST_RUN_WORKSPACE_TEAM_ID,
    btoa("trt:unq-first-test-id")
  );
  expect(await testsItems(page).count()).not.toBe(0);

  await waitForTestExecutions(page);

  //#region > Should show the newly-generated test run ID
  const executions = await page.locator(`[data-test-run-id="${testRunId}"]`);
  expect(await executions.count()).toBe(1);
});
