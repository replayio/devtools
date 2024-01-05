import { Locator, Page } from "@playwright/test";
import chalk from "chalk";

import { openContextMenu } from "../../helpers/console-panel";
import { selectContextMenuItem } from "../../helpers/context-menu";
import { debugPrint } from "../../helpers/utils";

export const noTestRunsMessage = (page: Page) => page.locator('[data-test-id="NoTestRuns"]');
export const noTestRunSelectedMessage = (page: Page) =>
  page.locator('[data-test-id="NoTestRunSelected"]');
export const noTestSelected = (page: Page) => page.locator('[data-test-id="NoTestSelected"]');

export const testRunsItems = (page: Page) => page.locator('[data-test-id="TestRunListItem"]');
export const testRunSummary = (page: Page) => page.locator('[data-test-id="TestRunSummary"]');
export const testRunResult = (page: Page) => page.locator('[data-test-id="TestRunResults"]');
export const testItems = (locator: Locator | Page) =>
  locator.locator('[data-test-id="TestRunResult-FileNode"]');

export const testRecordings = (page: Page) =>
  page.locator('[data-test-id="TestRunResultsListItem"]');
export const testErrors = (page: Page) => page.locator('[data-test-id="TestRunSpecDetails-Error"]');

export const filterRunsByText = async (page: Page, text: string) => {
  await debugPrint(page, `Filtering test runs list by text`, "filterTestRunsList");
  await page.fill("data-test-id=TestRunsPage-FilterByText-Input", text);
};

export const filterTestRunsByBranch = async (
  page: Page,
  searchText: string,
  contextMenuItemTestId: string
) => {
  const branchDropdown = page.locator('[data-test-id="TestRunsPage-BranchFilter-DropdownTrigger"]');
  await openContextMenu(branchDropdown, { useLeftClick: true });
  await selectContextMenuItem(page, { contextMenuItemTestId });
  await filterRunsByText(page, searchText);
};

export const filterSummaryTestsByText = async (page: Page, text: string) => {
  await debugPrint(page, `Filtering test list by text`, "filterTestList");
  await page.fill("data-test-id=TestRunSummary-Filter", text);
};

export const findTestRunByText = async (page: Page, locator: Locator, text: string) => {
  const count = await locator.count();
  for (let i = 0; i < count; i++) {
    const testRunItem = testRunsItems(page).nth(i);
    const testRunItemText = await testRunItem.innerText();
    if (testRunItemText.includes(text)) {
      return testRunItem;
    }
  }
  throw new Error(`Test run with text ${text} not found`);
};

export const startTest = async (page: Page, apiKey: string, teamId: string) => {
  const base = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:8080";
  const url = `${base}/team/${teamId}/tests?e2e=1&apiKey=${apiKey}`;
  await debugPrint(page, `Navigating to ${chalk.bold(url)}`, "startTestView");
  await page.goto(url);
  await page.locator('[data-test-id="TestList"]').waitFor();
  await page.locator('[data-test-id="TestListItem"]').first().waitFor();
};

export const noTestMatches = (page: Page) => page.locator('[data-test-id="NoTestMatches"]');

export const waitForTestRunResults = (page: Page) =>
  page.waitForSelector('[data-test-id="TestOverview"][data-pending="false"]');

export const filterTestsByText = async (page: Page, text: string) => {
  await debugPrint(page, `Filtering tests list by text`, "filterTestsByText");
  await page.fill("data-test-id=TestPage-FilterByText-Input", text);
};

export const testsItems = (page: Page, status?: "failure" | "flaky") => {
  if (status) {
    return page.locator(`[data-test-status="${status}"]`);
  }
  return page.locator('[data-test-id="TestListItem"]');
};
