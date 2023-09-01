import { Page, expect } from "@playwright/test";

import { waitFor } from "./utils";

type ToolboxLayout = "bottom" | "full" | "ide" | "left";

export async function getToolboxLayout(page: Page): Promise<ToolboxLayout | null> {
  await showUserOptionsDropdown(page);

  const element = await page.waitForSelector("[data-layout-option-selected]");
  const layout = await element.getAttribute("data-layout-option");

  expect(layout).not.toBeNull();

  return layout as ToolboxLayout;
}

export async function hideUserOptionsDropdown(page: Page) {
  const button = await page.waitForSelector('[data-test-id="UserOptions-DropdownButton"]');
  const state = await button.getAttribute("data-dropdown-state");
  if (state !== "closed") {
    await page.keyboard.press("Escape");

    await waitFor(async () => {
      const state = await button.getAttribute("data-dropdown-state");
      expect(state).toBe("closed");
    });
  }
}

export async function showUserOptionsDropdown(page: Page) {
  const button = await page.waitForSelector('[data-test-id="UserOptions-DropdownButton"]');
  const state = await button.getAttribute("data-dropdown-state");
  if (state === "closed") {
    await button.click();
  }

  await page.waitForSelector('[data-test-id="UserOptions-Dropdown"] [data-layout-option]');
}

export async function toggleToolboxLayout(page: Page, layout: ToolboxLayout): Promise<void> {
  await showUserOptionsDropdown(page);

  const element = await page.waitForSelector(`[data-layout-option="${layout}"]`);
  await element.click();

  // Changing layout options will not close the menu
  await hideUserOptionsDropdown(page);
}

export async function verifyToolboxLayout(page: Page, expected: ToolboxLayout): Promise<void> {
  await expect(await getToolboxLayout(page)).toBe(expected);
}

export async function verifyToolboxLayoutOptions(
  page: Page,
  expectedOptions: ToolboxLayout[]
): Promise<void> {
  await showUserOptionsDropdown(page);

  await page.waitForSelector("[data-layout-option]");

  const elements = page.locator("[data-layout-option]");
  const count = await elements.count();

  let actualOptions = [];
  for (let index = 0; index < count; index++) {
    const element = elements.nth(index);
    const option = await element.getAttribute("data-layout-option");
    actualOptions.push(option);
  }

  expect(actualOptions.sort()).toEqual(expectedOptions.sort());
}
