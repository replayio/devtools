import { Locator, Page } from "@playwright/test";

export async function getTestRows(page: Page) {
  return page.locator('[data-test-name="TestItemTreeRow"]');
}

export async function getCypressLogo(page: Page) {
  return page.locator('[data-test-name="ToolbarButton-CypressPanel"]');
}

export async function getTestRowChevron(row: Locator) {
  return row.locator(":scope", { hasText: "chevron_right" });
}

export async function getTestCaseSections(row: Locator) {
  return row.locator('[data-test-name="TestCaseSection"]');
}

export async function getTestCaseSteps(row: Locator) {
  return row.locator('[data-test-name="TestCaseSectionRow"]');
}

export async function getSelectedTestCase(row: Pick<Locator, "locator">) {
  return row.locator('[data-test-id="TestItemPanelBody"]');
}
