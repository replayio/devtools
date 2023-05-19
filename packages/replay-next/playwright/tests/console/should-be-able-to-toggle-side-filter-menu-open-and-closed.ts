import { expect, test } from "@playwright/test";

import { toggleSideMenu } from "../utils/console";
import { beforeEach } from "./beforeEach";
import { setup } from "./shared";

beforeEach();

test("should be able to toggle side filter menu open and closed", async ({ page }, testInfo) => {
  await setup(page, false);

  // The filters menu should be open by default.
  await expect(page.locator("[data-test-id=ConsoleFilterToggles]")).toHaveCount(1);

  // Fill in filter text; this should be remembered when the side menu is re-opened.
  await page.fill("[data-test-id=EventTypeFilterInput]", "test");

  // Verify that we can close it.
  await toggleSideMenu(page, false);
  await expect(page.locator("[data-test-id=ConsoleFilterToggles]")).toBeHidden();

  // Verify that we can re-open it and the same filter text will still be there.
  await toggleSideMenu(page, true);
  await expect(page.locator("[data-test-id=ConsoleFilterToggles]")).toBeVisible();
  const text = await page.locator("[data-test-id=EventTypeFilterInput]").inputValue();
  expect(text).toBe("test");

  // Close again and verify that the setting is remembered between page reloads.
  await toggleSideMenu(page, false);
  await expect(page.locator("[data-test-id=ConsoleFilterToggles]")).toBeHidden();
  await page.reload();
  await expect(page.locator("[data-test-id=ConsoleFilterToggles]")).toBeHidden();

  // Re-open and verify that the setting is remembered between page reloads.
  await toggleSideMenu(page, true);
  await expect(page.locator("[data-test-id=ConsoleFilterToggles]")).toBeVisible();
  await page.reload();
  await expect(page.locator("[data-test-id=ConsoleFilterToggles]")).toBeVisible();
});
