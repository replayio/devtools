import test, { expect } from "@playwright/test";

import { startLibraryTest } from "../../helpers";
import { TEMP_USER_API_KEY, TEMP_USER_TEAM_ID } from "../../helpers/authentication";
import { openContextMenu } from "../../helpers/console-panel";
import { selectContextMenuItem } from "../../helpers/context-menu";
import { debugPrint } from "../../helpers/utils";

const noTestRunsMessage = page => page.locator('[data-test-id="NoTestRuns"]');
const noTestRunSelectedMessage = page => page.locator('[data-test-id="NoTestRunSelected"]');
const noTestSelected = page => page.locator('[data-test-id="NoTestSelected"]');

const testRunsItems = page => page.locator('[data-test-id="TestRunListItem"]');
const testRunSummary = page => page.locator('[data-test-id="TestRunSummary"]');
const testItems = page => page.locator('[data-test-id="TestRunResult-FileNode"]');

const testRecordings = page => page.locator('[data-test-id="TestRunResultsListItem"]');
const testErrors = page => page.locator('[data-test-id="TestRunSpecDetails-Error"]');

const filterRunsByText = async (page, text) => {
  await debugPrint(page, `Filtering test runs list by text`, "filterTestRunsList");
  await page.fill("data-test-id=TestRunsPage-FilterByText-Input", text);
};

const filterTestsByText = async (page, text) => {
  await debugPrint(page, `Filtering test list by text`, "filterTestList");
  await page.fill("data-test-id=TestRunSummary-Filter", text);
};

//TODO:
// - Figure out which test data to use - we need something consistent for the test
// - Can we use hardcoded link? Deep link to test run is not working
// - If we want to test time range filter, we need a workspace with at least 30 days retention limit to enable that dropdown
// - Branch filter seems broken

test(`authenticated/test-suites/new-test-runs`, async ({ page }) => {
  await startLibraryTest(page, TEMP_USER_API_KEY, TEMP_USER_TEAM_ID);
  expect(await testRunsItems(page).count()).not.toBe(0);

  //#region > Test runs list

  //#region >>> Filter search result - no results
  await filterRunsByText(page, "something that would never exist");

  expect(await testRunsItems(page).count()).toBe(0);
  expect(await noTestRunsMessage(page).count()).toBe(1);
  expect(await noTestRunSelectedMessage(page).count()).toBe(1);
  expect(await noTestSelected(page).count()).toBe(1);
  //#endregion

  //#region >>> Filter search result - specific result
  await filterRunsByText(page, "fmt again.");

  expect(await testRunsItems(page).count()).toBe(1);
  const testItem = testRunsItems(page).first();
  expect(await testItem.innerText()).toContain("fmt again.");
  expect(await noTestRunsMessage(page).count()).toBe(0);
  expect(await noTestRunSelectedMessage(page).count()).toBe(1);
  expect(await noTestSelected(page).count()).toBe(1);
  //#endregion

  //#region >>> Workspace with limited retention limit should not show large time range filter
  expect(await page.locator('[data-test-id="month"]').count()).toBe(0);
  //#endregion
  //#endregion

  //#region > Selected test run

  //#region >>> Opens test run overview
  await filterRunsByText(page, "fmt again.");

  expect(await testRunsItems(page).count()).toBe(1);
  testRunsItems(page).first().click();
  await page.waitForSelector('[data-test-id="NoTestRunSelected"]', { state: "detached" });
  expect(await noTestSelected(page).count()).toBe(1);

  expect(await testRunSummary(page).count()).toBe(1);
  expect(await testRunSummary(page).innerText()).toContain("fmt again.");
  //#endregion

  //#region >>> Filter test by text
  await filterTestsByText(page, "logpoints-03_chromium");
  expect(await testItems(page).count()).toBe(1);
  expect(await testItems(page).innerText()).toContain(
    "logpoints-03_chromium: should display event properties in the console"
  );
  await filterTestsByText(page, "");
  //#endregion

  //#region >>> Filter by status
  const statusDropdown = page.locator(
    '[data-test-id="TestRunSummary-StatusFilter-DropdownTrigger"]'
  );
  openContextMenu(statusDropdown, { useLeftClick: true });
  await selectContextMenuItem(page, {
    contextMenuItemTestId: "failed-and-flaky",
  });
  expect(await testItems(page).count()).toBe(3);
  //#endregion

  //#region >>> Replays and errors
  testItems(page).first().click();
  await page.waitForSelector('[data-test-id="NoTestSelected"]', { state: "detached" });
  expect(await testRecordings(page).count()).toBe(4);
  expect(await testErrors(page).count()).toBe(4);
  //#endregion

  //#endregion
});
