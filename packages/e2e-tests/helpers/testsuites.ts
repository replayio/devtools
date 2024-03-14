import { Locator, Page, expect } from "@playwright/test";

import { getKeyValueEntryHeader, getKeyValueEntryValue } from "./object-inspector";
import { getByTestName, locatorTextToNumber, waitFor } from "./utils";

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

export async function openPlaywrightTestPanel(page: Page): Promise<void> {
  // Only click if it's not already open; clicking again will collapse the side bar.
  const pane = getTestSuitePanel(page);

  let isVisible = await pane.isVisible();

  if (!isVisible) {
    await getByTestName(page, "ToolbarButton-TestInfo").click();
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

export async function getTestSuiteResultsPassedCount(page: Page): Promise<number | null> {
  return locatorTextToNumber(getByTestName(page, "TestSuiteResultsPassedCount"));
}

export function getTestSuiteResultsFailedCount(page: Page): Promise<number | null> {
  return locatorTextToNumber(getByTestName(page, "TestSuiteResultsFailedCount"));
}

export function getTestSuiteResultsSkippedCount(page: Page) {
  return locatorTextToNumber(getByTestName(page, "TestSuiteResultsSkippedCount"));
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

export function getTestStepBeforeAfterButtons(page: Page) {
  return getByTestName(page, "ToggleBeforeAfterEventButton");
}

export function getUserActionEventDetails(page: Page) {
  return getByTestName(page, "UserActionEventDetails");
}

export async function getDetailsPaneContents(
  detailsPane: Locator
): Promise<Record<string, string>> {
  const keyValues = getByTestName(detailsPane, "KeyValue");
  await waitFor(async () => {
    expect(await detailsPane.isVisible()).toBe(true);
    const numKeyValues = await keyValues.count();
    expect(numKeyValues).toBeGreaterThan(0);
  });

  const detailsContents: Record<string, string> = {};

  const numKeyValues = await keyValues.count();
  for (let i = 0; i < numKeyValues; i++) {
    const keyValueLocator = keyValues.nth(i);
    const header = await getKeyValueEntryHeader(keyValueLocator);
    const value = await getKeyValueEntryValue(keyValueLocator);
    if (header != null && value != null) {
      detailsContents[header] = value;
    }
  }

  return detailsContents;
}
