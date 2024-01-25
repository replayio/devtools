import { startLibraryTest } from "../helpers";
import { TEST_RUN_WORKSPACE_API_KEY, TEST_RUN_WORKSPACE_TEAM_ID } from "../helpers/authentication";
import { testRecordings, testRunSummary, testRunsItems } from "../helpers/test-suite-dashboard";
import test, { expect } from "../testFixtureTestSuiteDashboard";

test.use({ testRunState: "FLAKY_IN_MAIN_WITH_SOURCE" });

test(`authenticated/new-test-suites/test-runs-04: test ID in the URL`, async ({
  pageWithMeta: { page, clientKey, testRunId },
}) => {
  await startLibraryTest(
    page,
    TEST_RUN_WORKSPACE_API_KEY,
    TEST_RUN_WORKSPACE_TEAM_ID,
    testRunId,
    btoa("trt:second-test-id")
  );
  expect(await testRunsItems(page).count()).not.toBe(0);

  // > Selected test run

  // >>> Opens test run overview and make sure that the selected test run is the correct one
  expect(await testRunSummary(page).innerText()).toContain(clientKey);

  // > Replay List

  // >>> Replay list should be displayed with the 1 passed recording
  expect(await testRecordings(page).count()).toBe(1);
  expect(await testRecordings(page).nth(0).getAttribute("data-test-status")).toBe("passed");
});
