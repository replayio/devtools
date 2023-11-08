import { Locator, Page, expect } from "@playwright/test";

import { openConsolePanel, warpToMessage } from "./console-panel";
import { openReactDevtoolsPanel as openReactDevtoolsPanelWithoutWorkaround } from "./react-devtools-panel";
import { waitFor } from "./utils";

export function getReactDevToolsPanel(page: Page) {
  return page.locator('[data-test-id="ReactDevToolsPanel"]');
}

export function getReactComponents(page: Page) {
  return getReactDevToolsPanel(page).locator('[data-test-name="ReactDevToolsListItem"]');
}

export async function waitForReactComponentCount(page: Page, expected: number) {
  const components = getReactComponents(page);
  return waitFor(async () => expect(await components.count()).toBe(expected));
}

export async function jumpToMessageAndCheckComponents(
  page: Page,
  message: string,
  componentCount: number
) {
  await openConsolePanel(page);
  await warpToMessage(page, message);
  await openReactDevtoolsPanel(page);
  await waitForReactComponentCount(page, componentCount);
}

export async function openReactDevtoolsPanel(page: Page) {
  await openReactDevtoolsPanelWithoutWorkaround(page);
  // workaround for FE-2044: go to the Console and then back to the RDT panel
  // to ensure that the RDT panel is updated
  await openConsolePanel(page);
  await openReactDevtoolsPanelWithoutWorkaround(page);
}

export async function verifyReactComponentIsSelected(component: Locator) {
  await expect(component).toHaveAttribute("data-selected", "true");
}
