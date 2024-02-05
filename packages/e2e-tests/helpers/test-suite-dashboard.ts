import { Locator, Page } from "@playwright/test";
import chalk from "chalk";

import { expect } from "../testFixtureTestSuiteDashboard";
import { openContextMenu } from "./console-panel";
import { selectContextMenuItem } from "./context-menu";
import { debugPrint, waitFor } from "./utils";

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

export const filterTestRunsByText = async (page: Page, text: string) => {
  await debugPrint(page, `Filtering test runs list by text: "${text}"`, "filterTestRunsList");

  await page.fill("data-test-id=TestRunsPage-FilterByText-Input", text);

  // Wait for the update to be rendered to the DOM before completing
  // This simplifies the corresponding expect() code in the caller
  const list = page.locator('[data-test-id="TestRunList"]');
  await expect(await list.getAttribute("data-filtered-by-text")).toBe(text);
};

export const filterTestRunsByBranch = async (page: Page, branch: "all" | "primary") => {
  await debugPrint(
    page,
    `Filtering test runs list by branch: "${branch}"`,
    "filterTestRunsByBranch"
  );

  const dropdown = page.locator('[data-test-id="TestRunsPage-BranchFilter-DropdownTrigger"]');
  await openContextMenu(dropdown, { useLeftClick: true });
  await selectContextMenuItem(page, {
    contextMenuItemTestId: branch === "primary" ? "show-only-primary-branch" : "show-all-branches",
  });

  // Wait for the update to be rendered to the DOM before completing
  // This simplifies the corresponding expect() code in the caller
  const list = page.locator('[data-test-id="TestRunList"]');
  await expect(await list.getAttribute("data-filtered-by-branch")).toBe(branch);
};

export const filterTestRunsByStatus = async (page: Page, status: "all" | "failed") => {
  await debugPrint(
    page,
    `Filtering test runs list by status: "${status}"`,
    "filterTestRunsByStatus"
  );

  const dropdown = page.locator('[data-test-id="TestRunsPage-ResultFilter-DropdownTrigger"]');
  await openContextMenu(dropdown, { useLeftClick: true });
  await selectContextMenuItem(page, {
    contextMenuItemTestId: status === "failed" ? "show-only-failures" : "show-all-runs",
  });

  // Wait for the update to be rendered to the DOM before completing
  // This simplifies the corresponding expect() code in the caller
  const list = page.locator('[data-test-id="TestRunList"]');
  await expect(await list.getAttribute("data-filtered-by-status")).toBe(status);
};

export const filterSummaryTestsByText = async (page: Page, text: string) => {
  await debugPrint(page, `Filtering test list by text: "${text}"`, "filterSummaryTestsByText");
  await page.fill("data-test-id=TestRunSummary-Filter", text);

  // Wait for the update to be rendered to the DOM before completing
  // This simplifies the corresponding expect() code in the caller
  const list = page.locator('[data-test-id="TestRunResults"]');
  await expect(await list.getAttribute("data-filtered-by-text")).toBe(text);
};

export const filterSummaryByStatus = async (page: Page, status: "all" | "failed-and-flaky") => {
  await debugPrint(
    page,
    `Filtering test summary list by status: "${status}"`,
    "filterSummaryByStatus"
  );

  const dropdown = page.locator('[data-test-id="TestRunSummary-StatusFilter-DropdownTrigger"]');
  await openContextMenu(dropdown, { useLeftClick: true });
  await selectContextMenuItem(page, {
    contextMenuItemTestId: status === "failed-and-flaky" ? "failed-and-flaky" : "all",
  });

  // Wait for the update to be rendered to the DOM before completing
  // This simplifies the corresponding expect() code in the caller
  const list = page.locator('[data-test-id="TestRunResults"]');
  await expect(await list.getAttribute("data-filtered-by-status")).toBe(status);
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

export const startTest = async (page: Page, apiKey: string, teamId: string, testId?: string) => {
  const base = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:8080";
  const url = `${base}/team/${teamId}/tests${testId ? `/${testId}` : ""}?e2e=1&apiKey=${apiKey}`;
  await debugPrint(page, `Navigating to ${chalk.bold(url)}`, "startTestView");
  await page.goto(url);
  await page.locator('[data-test-id="TestList"]').waitFor();
  await page.locator('[data-test-id="TestListItem"]').first().waitFor();

  if (testId) {
    await page.waitForSelector('[data-test-id="NoTestSelected"]', { state: "detached" });
  }
};

export const noTestMatches = (page: Page) => page.locator('[data-test-id="NoTestMatches"]');

export const waitForTestExecutions = (page: Page) =>
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

export const sortTestsBy = async (page: Page, sortOption: string) => {
  const rateSortDropdown = page.locator('[data-test-id="TestPage-ResultFilter-DropdownTrigger"]');
  await openContextMenu(rateSortDropdown, { useLeftClick: true });
  await selectContextMenuItem(page, { contextMenuItemTestId: sortOption });
};

export const findTestByText = async (page: Page, text: string) => {
  const testItemWithExecutions = (await testsItems(page).all()).find(async item => {
    const title = await item.innerText();
    return title.includes(text);
  });
  if (!testItemWithExecutions) {
    throw new Error("Test item not found");
  }
  return testItemWithExecutions;
};
