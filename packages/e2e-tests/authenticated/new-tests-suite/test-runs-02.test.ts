import { startLibraryTest } from "../../helpers";
import {
  TEST_RUN_WORKSPACE_API_KEY,
  TEST_RUN_WORKSPACE_TEAM_ID,
} from "../../helpers/authentication";
import { openContextMenu } from "../../helpers/console-panel";
import { selectContextMenuItem } from "../../helpers/context-menu";
import test, { expect } from "../../testFixtureTestRuns";
import {
  filterRunsByText,
  findTestRunByText,
  noTestSelected,
  testRunResult,
  testRunSummary,
  testRunsItems,
} from "./test-runs.utils";

test.use({ testRunState: "FAILED_IN_TEMP_BRANCH_WITHOUT_SOURCE" });

test(`authenticated/new-test-suites/test-runs`, async ({ pageWithMeta: { page, clientKey } }) => {
  await startLibraryTest(page, TEST_RUN_WORKSPACE_API_KEY, TEST_RUN_WORKSPACE_TEAM_ID);
  expect(await testRunsItems(page).count()).not.toBe(0);

  //#region > List view

  //#region >>> Filter by primary branch
  const branchDropdown = page.locator('[data-test-id="TestRunsPage-BranchFilter-DropdownTrigger"]');
  await openContextMenu(branchDropdown, { useLeftClick: true });
  await selectContextMenuItem(page, {
    contextMenuItemTestId: "show-only-primary-branch",
  });
  await filterRunsByText(page, clientKey);
  expect(await testRunsItems(page).count()).toBe(0);
  await filterRunsByText(page, "");
  await openContextMenu(branchDropdown, { useLeftClick: true });
  await selectContextMenuItem(page, {
    contextMenuItemTestId: "show-all-branches",
  });
  //#endregion

  //#region >>> A test run with any failing tests should display a count of the failures to the left of the test run title
  const testRunItemCount = await testRunsItems(page).count();
  let failedRun = await findTestRunByText(page, testRunsItems(page), clientKey);
  expect(failedRun).toBeTruthy();

  const testRunStatusPill = failedRun.locator('[data-test-status="fail"]');
  expect(await testRunStatusPill.count()).toBe(1);
  expect(await testRunStatusPill.innerText()).toBe("1");
  //#endregion

  //#endregion

  //#region >>> Run Overview

  //#region >>> Opens test run overview and match the title
  await filterRunsByText(page, clientKey);

  expect(await testRunsItems(page).count()).toBe(1);
  await testRunsItems(page).first().click();
  await page.waitForSelector('[data-test-id="NoTestRunSelected"]', { state: "detached" });
  expect(await noTestSelected(page).count()).toBe(1);
  expect(await testRunSummary(page).count()).toBe(1);
  expect(await testRunSummary(page).innerText()).toContain(clientKey);

  const overviewTitle = testRunSummary(page).locator('[data-test-id="TestRunSummary-Title"]');
  const testItemTitle = testRunsItems(page).first().locator('[data-test-id="TestRun-Title"]');
  expect(await overviewTitle.innerText()).toContain(await testItemTitle.innerText());
  //#endregion

  //#region >>> The number of failed, flaky, and passing tests should be displayed in a colored box
  const failedPillCount = testRunSummary(page).locator('[data-test-id="Pill-failed"]');
  const flakyPillCount = testRunSummary(page).locator('[data-test-id="Pill-flaky"]');
  const successPillCount = testRunSummary(page).locator('[data-test-id="Pill-success"]');
  expect(await failedPillCount.innerText()).toBe("1");
  expect(await flakyPillCount.innerText()).toBe("2");
  expect(await successPillCount.innerText()).toBe("2");
  //#endregion

  //#region >>> The relative time of the test run creation date should be displayed
  const testRunItemDate = testRunSummary(page).locator('[data-test-id="TestRun-Date"]');
  expect(await testRunItemDate.count()).toBe(1);
  //#endregion

  //#region >>> The test duration should be displayed as the sum of the duration of every test in the run
  const testRunDuration = testRunSummary(page).locator('[data-test-id="TestRun-Duration"]');
  expect(await testRunDuration.count()).toBe(1);
  expect(await testRunDuration.getAttribute("title")).toEqual("700.0ms");
  //#endregion

  //#region >>> trigger author, branch name, workflow link pull request number and link should NOT be displayed
  const commitAuthor = testRunSummary(page).locator('[data-test-id="TestRun-Username"]');
  expect(await commitAuthor.count()).toBe(0);

  const testRunBranch = testRunSummary(page).locator('[data-test-id="TestRun-Branch"]');
  expect(await testRunBranch.count()).toBe(0);

  const workflowLink = testRunSummary(page).locator('[data-test-id="TestRun-WorkflowLink"]');
  expect(await workflowLink.count()).toBe(0);

  const pullRequest = testRunSummary(page).locator('[data-test-id="TestRun-PullRequest"]');
  expect(await pullRequest.count()).toBe(0);
  //#endregion

  //#region >>> Failed, Flaky, and Passed tests should be rendered in separate sections
  const failedTests = testRunResult(page).locator(
    '[data-test-id="TestRunResults-StatusGroup-failed"]'
  );
  expect(await failedTests.count()).toBe(1);
  expect(await failedTests.locator('[data-test-id="TestRunResult-FileNode"]').count()).toBe(1);
  expect(
    await failedTests.locator('[data-test-id="TestRunResults-StatusGroup-Count"]').innerText()
  ).toEqual("1");

  const flakyTests = testRunResult(page).locator(
    '[data-test-id="TestRunResults-StatusGroup-flaky"]'
  );
  expect(await flakyTests.count()).toBe(1);
  expect(await flakyTests.locator('[data-test-id="TestRunResult-FileNode"]').count()).toBe(2);
  expect(
    await flakyTests.locator('[data-test-id="TestRunResults-StatusGroup-Count"]').innerText()
  ).toEqual("2");

  const successTests = testRunResult(page).locator(
    '[data-test-id="TestRunResults-StatusGroup-passed"]'
  );
  expect(await successTests.count()).toBe(1);
  expect(await successTests.locator('[data-test-id="TestRunResult-FileNode"]').count()).toBe(2);
  expect(
    await successTests.locator('[data-test-id="TestRunResults-StatusGroup-Count"]').innerText()
  ).toEqual("2");
  //#endregion
  //#endregion
});
