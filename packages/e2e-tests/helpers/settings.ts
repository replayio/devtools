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
  await page.locator("#BooleanPreference-feature_showPassport").check();
  await closeSettingsModal(page);
}

export async function enableReduxDevtools(page: Page) {
  await openSettingsModal(page);
  await page.locator('.modal-content li:has-text("Experimental")').click();
  await page.locator("#BooleanPreference-feature_reduxDevTools").check();
  await closeSettingsModal(page);
}
