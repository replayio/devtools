import { startLibraryTest } from "../../helpers";
import {
  TEST_RUN_WORKSPACE_API_KEY,
  TEST_RUN_WORKSPACE_TEAM_ID,
} from "../../helpers/authentication";
import test, { expect } from "../../testFixtureTestRuns";
import {
  filterRunsByText,
  testRecordings,
  testRunSummary,
  testRunsItems,
} from "./test-suite.utils";

test.use({ testRunState: "FLAKY_IN_MAIN_WITH_SOURCE" });

// this function takes a ms argument and returns a promise
// that resolves after that has passed
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

test(`authenticated/new-test-suites/test-runs-03: flaky run in main branch with source`, async ({
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

  //#region >>> Opens test run overview and match the title
  // correct title in the overview
  await filterRunsByText(page, clientKey);

  expect(await testRunsItems(page).count()).toBe(1);
  expect(await testRunSummary(page).count()).toBe(1);
  expect(await testRunSummary(page).innerText()).toContain(clientKey);
  //#endregion
  //#endregion

  //#region > Replay List

  //#region >>> Replay list should be displayed with both passed and flaky recording
  expect(await testRecordings(page).count()).toBe(1);
  expect(await testRecordings(page).nth(0).getAttribute("data-test-status")).toBe("passed");
  //#endregion
  //#endregion
});
