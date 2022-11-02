import { Locator, Page, expect } from "@playwright/test";

type ToolboxLayout = "bottom" | "full" | "ide" | "left";

export function getConsoleDockButton(page: Page): Locator {
  return page.locator("[data-test-id=consoleDockButton]");
}

export async function getConsoleDockLayout(page: Page): Promise<ToolboxLayout | null> {
  const button = getConsoleDockButton(page);
  const state = await button.getAttribute("data-test-state");
  return state ? (state as ToolboxLayout) : null;
}

export function getConsoleDockFullViewButton(page: Page): Locator {
  return page.locator("[data-test-id=DockFullViewButton]");
}

export function getConsoleDockSplitViewButton(page: Page): Locator {
  return page.locator("[data-test-id=DockSplitViewButton]");
}

export function getConsoleDockToBottomButton(page: Page): Locator {
  return page.locator("[data-test-id=DockToBottomButton]");
}

export function getConsoleDockToBottomRightButton(page: Page): Locator {
  return page.locator("[data-test-id=DockToBottomRightButton]");
}

export function getConsoleDockToLeftButton(page: Page): Locator {
  return page.locator("[data-test-id=DockToLeftButton]");
}

export async function verifyConsoleLayout(page: Page, expected: ToolboxLayout): Promise<void> {
  await expect(await getConsoleDockLayout(page)).toBe(expected);
}
