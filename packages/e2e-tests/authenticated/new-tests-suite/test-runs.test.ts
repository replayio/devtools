import test, { expect } from "@playwright/test";

import { startLibraryTest } from "../../helpers";
import { TEMP_USER_API_KEY, TEMP_USER_TEAM_ID } from "../../helpers/authentication";
import { debugPrint } from "../../helpers/utils";

const filterByTextSearch = async (page, text) => {
  await debugPrint(page, `Filtering test runs list by text`, "filterTestRunsList");
  await page.fill("data-test-id=TestRunsPage-FilterByText-Input", text);
};

//TODO:
// - Figure out which test data to use - we need something consistent for the test
// - Can we use hardcoded link? Deep link to test run is not working
// - If we want to test time range filter, we need a workspace with at least 30 days retention limit to enable that dropdown
// - Branch filter seems broken
// - Test Runs overview: Filter by text
// - Test Runs overview: Filter by flaky or failed
// - List of replay and error

test(`authenticated/test-suites/library-test-runs`, async ({ page }) => {
  await startLibraryTest(page, TEMP_USER_API_KEY, TEMP_USER_TEAM_ID);
  const searchResultItems = page.locator('[data-test-id="TestRunListItem"]');
  expect(await searchResultItems.count()).not.toBe(0);

  //#region Filter search result - no results
  await filterByTextSearch(page, "something that would never exist");

  expect(await searchResultItems.count()).toBe(0);
  expect(await page.locator('[data-test-id="NoTestRuns"]').count()).toBe(1);
  expect(await page.locator('[data-test-id="NoTestRunSelected"]').count()).toBe(1);
  //#endregion

  //#region Filter search result - specific result
  await filterByTextSearch(page, "fmt again.");

  expect(await searchResultItems.count()).toBe(1);
  const testItem = searchResultItems.first();
  expect(await testItem.innerText()).toContain("fmt again.");
  expect(await page.locator('[data-test-id="NoTestRuns"]').count()).toBe(0);
  //#endregion

  //#region Workspace with limited retention limit should not show large time range filter
  expect(await page.locator('[data-test-id="month"]').count()).toBe(0);
  //#endregion
});
