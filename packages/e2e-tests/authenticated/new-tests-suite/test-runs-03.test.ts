import { startLibraryTest } from "../../helpers";
import {
  TEST_RUN_WORKSPACE_API_KEY,
  TEST_RUN_WORKSPACE_TEAM_ID,
} from "../../helpers/authentication";
import test, { expect } from "../../testFixtureTestRuns";
import {
  filterRunsByText,
  findTestRunByText,
  noTestSelected,
  testItems,
  testRecordings,
  testRunSummary,
  testRunsItems,
} from "./test-runs.utils";

test.use({ testRunState: "FLAKY_IN_MAIN_WITH_SOURCE" });

test(`authenticated/new-test-suites/test-runs`, async ({ pageWithMeta: { page, clientKey } }) => {
  await startLibraryTest(page, TEST_RUN_WORKSPACE_API_KEY, TEST_RUN_WORKSPACE_TEAM_ID);
  expect(await testRunsItems(page).count()).not.toBe(0);

  //#region > List view

  //#region >>> A test run in which all tests are flaky should display a green checkmark to the left of the test run title
  const flakyRun = await findTestRunByText(page, testRunsItems(page), clientKey);

  const testRunItemIcon = flakyRun.locator('[data-test-status="success"]');
  expect(await testRunItemIcon.count()).toBe(1);
  //#endregion
  //#endregion

  //#region > Selected test run

  //#region >>> Opens test run overview and match the title
  await filterRunsByText(page, clientKey);

  expect(await testRunsItems(page).count()).toBe(1);
  const testItem = testRunsItems(page).first();
  await testItem.click();
  await page.waitForSelector('[data-test-id="NoTestRunSelected"]', { state: "detached" });
  expect(await noTestSelected(page).count()).toBe(1);
  expect(await testRunSummary(page).count()).toBe(1);
  expect(await testRunSummary(page).innerText()).toContain(clientKey);

  const overviewTitle = testRunSummary(page).locator('[data-test-id="TestRunSummary-Title"]');
  const testItemTitle = testItem.locator('[data-test-id="TestRun-Title"]');
  expect(await overviewTitle.innerText()).toContain(await testItemTitle.innerText());
  //#endregion

  //#region >>> The number of failed, flaky, and passing tests should be displayed in a colored box
  const failedPillCount = testRunSummary(page).locator('[data-test-id="Pill-failed"]');
  const flakyPillCount = testRunSummary(page).locator('[data-test-id="Pill-flaky"]');
  const successPillCount = testRunSummary(page).locator('[data-test-id="Pill-success"]');
  expect(await failedPillCount.count()).toBe(0);
  expect(await flakyPillCount.innerText()).toBe("1");
  expect(await successPillCount.innerText()).toBe("2");
  //#endregion

  //#region >>> The relative time of the test run creation date should be displayed
  const testRunItemDate = testRunSummary(page).locator('[data-test-id="TestRun-Date"]');
  expect(await testRunItemDate.count()).toBe(1);
  //#endregion

  //#region >>> The test duration should be displayed as the sum of the duration of every test in the run
  const testRunDuration = testRunSummary(page).locator('[data-test-id="TestRun-Duration"]');
  expect(await testRunDuration.count()).toBe(1);
  expect(await testRunDuration.getAttribute("title")).toEqual("400.0ms");
  //#endregion

  //#region >>> trigger author, branch name, workflow link pull request number and link should be displayed
  const commitAuthor = testRunSummary(page).locator('[data-test-id="TestRun-Username"] > span');
  expect(await commitAuthor.count()).toBe(1);
  expect(await commitAuthor.innerText()).toContain("test-user-trigger");

  const testRunBranch = testRunSummary(page).locator('[data-test-id="TestRun-Branch"]');
  expect(await testRunBranch.count()).toBe(1);
  expect(await testRunBranch.innerText()).toContain("main");

  const testRunWorkflowHref = testRunSummary(page).locator('[data-test-id="TestRun-WorkflowLink"]');
  expect(await testRunWorkflowHref.count()).toBe(1);
  expect(await testRunWorkflowHref.getAttribute("href")).toContain("http://example.com");

  const testRunPullRequest = testRunSummary(page).locator('[data-test-id="TestRun-PullRequest"]');
  expect(await testRunPullRequest.count()).toBe(1);
  expect(await testRunPullRequest.innerText()).toContain("PR 1234");

  //#region >>> The icon should be the merged branch icon
  expect(await testRunBranch.getAttribute("data-test-branch")).toBe("primary");
  //#endregion

  //#endregion

  //#endregion

  //#region > Replay List

  //#region >>> Replay list should be displayed with both passed and flaky recording
  await testItems(page).filter({ hasText: "Third test" }).click();
  await page.waitForSelector('[data-test-id="NoTestSelected"]', { state: "detached" });
  expect(await testRecordings(page).count()).toBe(2);
  expect(await testRecordings(page).nth(0).getAttribute("data-test-status")).toBe("passed");
  expect(await testRecordings(page).nth(1).getAttribute("data-test-status")).toBe("flaky");
  //#endregion
  //#endregion
});
