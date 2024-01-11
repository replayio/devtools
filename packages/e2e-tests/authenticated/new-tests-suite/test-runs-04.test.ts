import { startLibraryTest } from "../../helpers";
import {
  TEST_RUN_WORKSPACE_API_KEY,
  TEST_RUN_WORKSPACE_TEAM_ID,
} from "../../helpers/authentication";
import test, { expect } from "../../testFixtureTestRuns";
import { testRecordings, testRunSummary, testRunsItems } from "./test-suite.utils";

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

  //#region > Selected test run

  //#region >>> Opens test run overview and make sure that the selected test run is the correct one
  expect(await testRunSummary(page).innerText()).toContain(clientKey);
  //#endregion
  //#endregion

  //#region > Replay List

  //#region >>> Replay list should be displayed with the 1 passed recording
  expect(await testRecordings(page).count()).toBe(1);
  expect(await testRecordings(page).nth(0).getAttribute("data-test-status")).toBe("passed");
  //#endregion
  //#endregion
});
