import { Locator, Page, expect } from "@playwright/test";

import { waitFor } from "./utils";

export function getReduxActions(page: Page) {
  return page.locator('[data-test-id="ReduxActionItem"]');
}

export async function assertTabValue(
  page: Page,
  tabState: Record<string, string>,
  tab: string,
  expectedValue: string
) {
  await page.locator(`[data-test-id="ReduxTabsContainer"] div:has-text("${tab}")`).click();
  const inspector = page.locator('[data-test-id="ReduxInspector"] > *');

  await inspector.waitFor();

  // remove once redux devtools get loading screen
  await waitFor(async () => expect(await inspector.innerText()).not.toBe(tabState[tab]));
  await waitFor(async () => expect(await inspector.innerText()).not.toBe("Loading…"));

  tabState[tab] = await inspector.innerText();

  expect(await inspector.innerText()).toBe(expectedValue);
}

export async function waitForReduxActionCount(page: Page, expected: number) {
  const actions = getReduxActions(page);
  return waitFor(async () => expect(await actions.count()).toBe(expected));
}

export async function openReduxDevtoolsPanel(page: Page) {
  await page.locator('[data-test-id="PanelButton-redux-devtools"]').click();
}
