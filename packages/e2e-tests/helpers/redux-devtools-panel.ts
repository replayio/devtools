import { Locator, Page, expect } from "@playwright/test";

import { waitFor } from "./utils";

export function getReduxActions(page: Page) {
  return page.locator('[data-test-id="ReduxActionItem"]');
}

export async function assertTabValue(page: Page, tab: string, expectedValue: string) {
  await page.locator(`[data-test-id="ReduxTabsContainer"] div:has-text("${tab}")`).click();

  const inspector = page.locator('[data-test-id="ReduxDevToolsContents"]');
  await inspector.waitFor();

  const currentPointContents = page.locator(`[data-test-id="ReduxDevtools"]`);
  await waitFor(() =>
    expect(currentPointContents.getByTestId("indeterminate-loader")).toHaveCount(0)
  );

  expect(await inspector.innerText()).toBe(expectedValue);
}

export async function waitForReduxActionCount(page: Page, expected: number) {
  const actions = getReduxActions(page);
  return waitFor(async () => expect(await actions.count()).toBe(expected));
}

export async function openReduxDevtoolsPanel(page: Page) {
  await page.locator('[data-test-id="PanelButton-redux-devtools"]').click();
}
