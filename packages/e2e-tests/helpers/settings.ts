import { Page } from "@playwright/test";

export async function openSettingsModal(page: Page) {
  // Don't want to use `showUserOptionsDropdown` here, as it
  // waits for user settings, and the user may not be logged in
  // in the auth tests
  await page.locator(".user-options").click();
  await page.locator('.dropdown-container button:has-text("Settings")').click();
}

export async function closeSettingsModal(page: Page) {
  await page.locator(".modal-content .modal-close").click();
}

export async function enablePassport(page: Page) {
  await openSettingsModal(page);
  await page.locator("#BooleanPreference-feature_showPassport").check();
  await closeSettingsModal(page);
}
