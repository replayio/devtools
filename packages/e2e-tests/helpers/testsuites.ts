import { Locator, Page } from "@playwright/test";

import {
  clearTextArea,
  debugPrint,
  delay,
  getByTestName,
  getCommandKey,
  mapLocators,
  waitFor,
} from "./utils";

export function getTestSuitePanel(page: Page) {
  return getByTestName(page, "TestSuitePanel");
}

export async function openCypressTestPanel(page: Page): Promise<void> {
  // Only click if it's not already open; clicking again will collapse the side bar.
  const pane = getTestSuitePanel(page);

  let isVisible = await pane.isVisible();

  if (!isVisible) {
    await getByTestName(page, "ToolbarButton-CypressPanel").click();
  }
}

export function getTestRows(page: Page) {
  return getByTestName(page, "TestRecordingTreeRow");
}

export function getCypressLogo(page: Page) {
  return getByTestName(page, "ToolbarButton-CypressPanel");
}

export function getTestRowChevron(row: Locator) {
  return row.locator(":scope", { hasText: "chevron_right" });
}

export function getTestRecordingTrees(page: Page) {
  return getByTestName(page, "TestRecordingTree");
}

export function getTestSections(row: Locator) {
  return getByTestName(row, "TestSection");
}

export function getTestCaseSteps(row: Page | Locator) {
  return getByTestName(row, "TestSectionRow");
}

export function getSelectedTestCase(row: Page | Locator) {
  return row.locator('[data-test-id="TestRecordingPanelBody"]');
}

export function getTestSuiteResult(page: Page) {
  return getByTestName(page, "TestSuiteResult");
}

export function getTestSuiteResultsPassedCount(page: Page) {
  return getByTestName(page, "TestSuiteResultsPassedCount");
}

export function getTestSuiteResultsFailedCount(page: Page) {
  return getByTestName(page, "TestSuiteResultsFailedCount");
}

export function getTestSuiteResultsSkippedCount(page: Page) {
  return getByTestName(page, "TestSuiteResultsSkippedCount");
}

export function getTestRecordingBackButton(page: Page) {
  return getByTestName(page, "TestRecordingBackButton");
}

export function getTestSuiteDate(page: Page) {
  return getByTestName(page, "TestSuiteDate");
}

export function getTestSuiteUser(page: Page) {
  return getByTestName(page, "TestSuiteUser");
}

export function getTestSuiteDuration(page: Page) {
  return getByTestName(page, "TestSuiteDuration");
}

export function getTestSuiteBranch(page: Page) {
  return getByTestName(page, "TestSuiteBranch");
}

export function getErrorRows(page: Page) {
  const steps = getTestCaseSteps(page);
  return steps.filter({
    has: page.locator(`[data-status="error"]`),
  });
}
