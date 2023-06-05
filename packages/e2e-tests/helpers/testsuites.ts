import { Locator, Page } from "@playwright/test";

import { clearTextArea, debugPrint, delay, getCommandKey, mapLocators, waitFor } from "./utils";

export function getTestSuitePanel(page: Page) {
  return page.locator(`[data-test-name="TestSuitePanel"]`);
}

export async function openCypressTestPanel(page: Page): Promise<void> {
  // Only click if it's not already open; clicking again will collapse the side bar.
  const pane = getTestSuitePanel(page);

  let isVisible = await pane.isVisible({ timeout: 15000 });
  debugPrint(page, "Test panel visible: " + isVisible);

  if (!isVisible) {
    await page.locator('[data-test-name="ToolbarButton-CypressPanel"]').click();
  }
}

export async function getTestRows(page: Page) {
  return page.locator('[data-test-name="TestItemTreeRow"]');
}

export async function getCypressLogo(page: Page) {
  return page.locator('[data-test-name="ToolbarButton-CypressPanel"]');
}

export async function getTestRowChevron(row: Locator) {
  return row.locator(":scope", { hasText: "chevron_right" });
}

export async function getTestSections(row: Locator) {
  return row.locator('[data-test-name="TestSection"]');
}

export async function getTestCaseSteps(row: Locator) {
  return row.locator('[data-test-name="TestSectionRow"]');
}

export async function getSelectedTestCase(row: Pick<Locator, "locator">) {
  return row.locator('[data-test-id="TestItemPanelBody"]');
}
