import { Locator, Page } from "@playwright/test";

import { debugPrint } from "../../helpers/utils";

export const noTestRunsMessage = (page: Page) => page.locator('[data-test-id="NoTestRuns"]');
export const noTestRunSelectedMessage = (page: Page) =>
  page.locator('[data-test-id="NoTestRunSelected"]');
export const noTestSelected = (page: Page) => page.locator('[data-test-id="NoTestSelected"]');

export const testRunsItems = (page: Page) => page.locator('[data-test-id="TestRunListItem"]');
export const testRunSummary = (page: Page) => page.locator('[data-test-id="TestRunSummary"]');
export const testItems = (page: Page) => page.locator('[data-test-id="TestRunResult-FileNode"]');

export const testRecordings = (page: Page) =>
  page.locator('[data-test-id="TestRunResultsListItem"]');
export const testErrors = (page: Page) => page.locator('[data-test-id="TestRunSpecDetails-Error"]');

export const filterRunsByText = async (page: Page, text: string) => {
  await debugPrint(page, `Filtering test runs list by text`, "filterTestRunsList");
  await page.fill("data-test-id=TestRunsPage-FilterByText-Input", text);
};

export const filterTestsByText = async (page: Page, text: string) => {
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
};
