import { Page } from "@playwright/test";

export async function openSettingsModal(page: Page) {
  await page.locator(".user-options").click();
  await page.locator('.dropdown-container button:has-text("Settings")').click();
}

export async function closeSettingsModal(page: Page) {
  await page.locator(".modal-content .modal-close").click();
}

export async function enablePassport(page: Page) {
  await openSettingsModal(page);
  await page.locator("#BooleanPreference-showPassport").check();
  await closeSettingsModal(page);
}
