import test, { Page, expect } from "@playwright/test";
import chalk from "chalk";

import { TEMP_USER_API_KEY, TEMP_USER_TEAM_ID } from "../../helpers/authentication";
import { openContextMenu } from "../../helpers/console-panel";
import { selectContextMenuItem } from "../../helpers/context-menu";
import { debugPrint } from "../../helpers/utils";

const startTest = async (page: Page, apiKey: string, teamId: string) => {
  const base = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:8080";
  const url = `${base}/team/${teamId}/tests?e2e=1&apiKey=${apiKey}`;
  await debugPrint(page, `Navigating to ${chalk.bold(url)}`, "startLibraryTest");
  await page.goto(url);
  await page.locator('[data-test-id="TestList"]').waitFor();
  await page.locator('[data-test-id="TestListItem"]').first().waitFor();
};

const noTestMatches = (page: Page) => page.locator('[data-test-id="NoTestMatches"]');
const noTestSelected = (page: Page) => page.locator('[data-test-id="NoTestSelected"]');

const waitForTestRunResults = (page: Page) =>
  page.waitForSelector('[data-test-id="TestOverview"][data-pending="false"]');

const filterTestsByText = async (page: Page, text: string) => {
  await debugPrint(page, `Filtering tests list by text`, "filterTestsByText");
  await page.fill("data-test-id=TestPage-FilterByText-Input", text);
};

const testsItems = (page: Page, status?: "failure" | "flaky") => {
  if (status) {
    return page.locator(`[data-test-status="${status}"]`);
  }
  return page.locator('[data-test-id="TestListItem"]');
};

//TODO:
// - Figure out a way to make sure we always have same test available. Right now what we are using will go away in 7 days.
// - Move that test run (/test) to golden workspace

test(`authenticated/new-test-suites/tests`, async ({ page }) => {
  await startTest(page, TEMP_USER_API_KEY, TEMP_USER_TEAM_ID);
  expect(await testsItems(page).count()).not.toBe(0);

  //#region > Test runs list
  const rateSortDropdown = page.locator('[data-test-id="TestPage-ResultFilter-DropdownTrigger"]');

  //#region >>> Sort by flaky rate
  await openContextMenu(rateSortDropdown, { useLeftClick: true });
  await selectContextMenuItem(page, {
    contextMenuItemTestId: "flakyRate",
  });
  expect(await testsItems(page, "failure").count()).toBe(0);
  expect(await testsItems(page, "flaky").count()).not.toBe(0);
  //#endregion

  //#region >>> Sort by failure rate
  openContextMenu(rateSortDropdown, { useLeftClick: true });
  await selectContextMenuItem(page, {
    contextMenuItemTestId: "failureRate",
  });
  expect(await testsItems(page, "failure").count()).not.toBe(0);
  expect(await testsItems(page, "flaky").count()).toBe(0);
  //#endregion

  //#region >>> Sort alphabetically
  await openContextMenu(rateSortDropdown, { useLeftClick: true });
  await selectContextMenuItem(page, {
    contextMenuItemTestId: "alphabetical",
  });
  expect(await testsItems(page, "failure").count()).not.toBe(0);
  expect(await testsItems(page).first().innerText()).toContain("authenticated/comments-01");
  //#endregion

  //#region >>> Filter search result - no results
  await filterTestsByText(page, "something that would never exist");
  expect(await testsItems(page).count()).toBe(0);
  expect(await noTestMatches(page).count()).toBe(1);
  expect(await noTestSelected(page).count()).toBe(1);
  //#endregion

  //#region >>> Filter search result - specific result
  await filterTestsByText(page, "logpoints-03_chromium");
  expect(await testsItems(page).count()).toBe(1);
  const testItem = testsItems(page).first();
  expect(await testItem.innerText()).toContain("logpoints-03_chromium");
  await filterTestsByText(page, "");
  //#endregion

  //#region >>> List of executions
  const testItemWithExecutions = testsItems(page).first();
  await testItemWithExecutions.click();
  await waitForTestRunResults(page);
  expect(await page.locator('[data-test-id="ExecutionItem"]').count()).not.toBe(0);
  //#endregion

  //#endregion
});
