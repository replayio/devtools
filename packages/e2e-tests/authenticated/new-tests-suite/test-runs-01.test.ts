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
  filterTestsByText,
  findTestRunByText,
  noTestRunSelectedMessage,
  noTestRunsMessage,
  noTestSelected,
  testErrors,
  testItems,
  testRecordings,
  testRunSummary,
  testRunsItems,
} from "./test-runs.utils";

test.use({ testRunState: "SUCCESS_IN_MAIN_WITH_SOURCE" });

test(`authenticated/new-test-suites/test-runs`, async ({ pageWithMeta: { page, clientKey } }) => {
  await startLibraryTest(page, TEST_RUN_WORKSPACE_API_KEY, TEST_RUN_WORKSPACE_TEAM_ID);
  expect(await testRunsItems(page).count()).not.toBe(0);

  //#region > List view

  //#region >>> When source control metadata is present, the title should be the commit title
  const itemCounts = await testRunsItems(page).count();
  let testRun = await findTestRunByText(page, testRunsItems(page), clientKey);
  expect(testRun).toBeTruthy();
  //#endregion

  //#region >>> When all tests pass should display a green checkmark to the left of the test run title
  const testRunItemIcon = testRun.locator('[data-test-status="success"]');
  expect(await testRunItemIcon.count()).toBe(1);
  //#endregion

  //#region >>> The relative time of the test run creation date should be displayed to the right of the test run title
  const testRunItemDate = testRun.locator('[data-test-id="TestRun-Date"]');
  expect(await testRunItemDate.count()).toBe(1);
  //#endregion

  //#region >>> Filted by text, only test runs in which the pull request title match the provided text should be displayed
  await filterRunsByText(page, clientKey);

  expect(await testRunsItems(page).count()).toBe(1);
  const testItem = testRunsItems(page).first();
  expect(await testItem.innerText()).toContain(clientKey);
  expect(await noTestRunsMessage(page).count()).toBe(0);
  await filterRunsByText(page, "");
  //#endregion

  //#region >>> filtered by failures, only test runs containing one or more failures should be displayed
  const resultDropdown = page.locator('[data-test-id="TestRunsPage-ResultFilter-DropdownTrigger"]');
  await openContextMenu(resultDropdown, { useLeftClick: true });
  await selectContextMenuItem(page, {
    contextMenuItemTestId: "show-only-failures",
  });
  const failedItemsCount = await testRunsItems(page).count();
  for (let i = 0; i < failedItemsCount; i++) {
    const testRunItem = testRunsItems(page).nth(i);
    expect(await testRunItem.locator('[data-test-status="failed"]').count()).toBe(1);
  }
  await openContextMenu(resultDropdown, { useLeftClick: true });
  await selectContextMenuItem(page, {
    contextMenuItemTestId: "show-all-runs",
  });
  //#endregion

  //#region >>> Workspace with limited retention limit should not show large time range filter
  expect(await page.locator('[data-test-id="month"]').count()).toBe(0);
  //#endregion

  //#region > Selected test run

  //#region >>> Opens test run overview
  await filterRunsByText(page, clientKey);

  expect(await testRunsItems(page).count()).toBe(1);
  testRunsItems(page).first().click();
  await page.waitForSelector('[data-test-id="NoTestRunSelected"]', { state: "detached" });
  expect(await noTestSelected(page).count()).toBe(1);

  expect(await testRunSummary(page).count()).toBe(1);
  expect(await testRunSummary(page).innerText()).toContain(clientKey);
  //#endregion

  //#region >>> When a test run does not have any of failed or flaky results, Pills with corresponding status should not be displayed
  const failedPillCount = testRunSummary(page).locator('[data-test-id="Pill-failed"]');
  const flakyPillCount = testRunSummary(page).locator('[data-test-id="Pill-flaky"]');
  expect(await failedPillCount.count()).toBe(0);
  expect(await flakyPillCount.count()).toBe(0);
  //#endregion

  //#region >>> Filter test by text
  await filterTestsByText(page, clientKey);
  expect(await testItems(page).count()).toBe(2);
  expect(await testItems(page).nth(0).innerText()).toContain(clientKey);
  expect(await testItems(page).nth(1).innerText()).toContain(clientKey);
  await filterTestsByText(page, "");
  //#endregion

  //#region >>> Filter by status
  const statusDropdown = page.locator(
    '[data-test-id="TestRunSummary-StatusFilter-DropdownTrigger"]'
  );
  await openContextMenu(statusDropdown, { useLeftClick: true });
  await selectContextMenuItem(page, {
    contextMenuItemTestId: "failed-and-flaky",
  });
  expect(await testItems(page).count()).toBe(0);
  await openContextMenu(statusDropdown, { useLeftClick: true });
  await selectContextMenuItem(page, {
    contextMenuItemTestId: "all",
  });
  //#endregion

  //#region >>> Replays and errors
  testItems(page).first().click();
  await page.waitForSelector('[data-test-id="NoTestSelected"]', { state: "detached" });
  expect(await testRecordings(page).count()).toBe(1);
  expect(await testErrors(page).count()).toBe(0);
  //#endregion

  //#endregion

  //#region >>> When a test run was selected but omitted due to a change in filter, the run details view should show a message
  await filterRunsByText(page, "something that would never exist");

  expect(await testRunsItems(page).count()).toBe(0);
  expect(await noTestRunsMessage(page).count()).toBe(1);
  expect(await noTestRunSelectedMessage(page).count()).toBe(1);
  expect(await noTestSelected(page).count()).toBe(1);
  //#endregion
});
