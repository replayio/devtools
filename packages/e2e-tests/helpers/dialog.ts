import { Locator, Page, expect } from "@playwright/test";

import { debugPrint } from "./utils";

export async function confirmDialog(
  page: Page,
  options: {
    dialogTestId?: string;
    dialogTestName?: string;
    dialogText?: string;
  }
) {
  const { dialogTestId, dialogTestName, dialogText } = options;

  await debugPrint(page, `Confirming active dialog`, "confirmDialog");

  let buttonLocator: Locator;
  if (dialogTestId) {
    buttonLocator = page.locator(`[data-test-id="${dialogTestId}-ConfirmButton"]`);
  } else if (dialogTestName) {
    buttonLocator = page.locator(`[data-test-name="${dialogTestName}-ConfirmButton"]`);
  } else if (dialogText) {
    buttonLocator = page.locator(
      `[data-test-name="ConfirmDialog"]:has-text("${dialogText}") [data-test-name="ConfirmDialog-ConfirmButton"]`
    );
  } else {
    buttonLocator = page.locator('[data-test-name="ConfirmDialog-ConfirmButton"]');
  }

  await buttonLocator.click();
  await expect(await buttonLocator.isVisible()).toBe(false);
}

export async function declineDialog(
  page: Page,
  options: {
    dialogTestId?: string;
    dialogTestName?: string;
    dialogText?: string;
  }
) {
  const { dialogTestId, dialogTestName, dialogText } = options;

  await debugPrint(page, `Declining active dialog`, "declineDialog");

  let buttonLocator: Locator;
  if (dialogTestId) {
    buttonLocator = page.locator(`[data-test-id="${dialogTestId}-DeclineButton"]`);
  } else if (dialogTestName) {
    buttonLocator = page.locator(`[data-test-name="${dialogTestName}-DeclineButton"]`);
  } else if (dialogText) {
    buttonLocator = page.locator(
      `[data-test-name="DeclineDialog"]:has-text("${dialogText}") [data-test-name="DeclineDialog-DeclineButton"]`
    );
  } else {
    buttonLocator = page.locator('[data-test-name="DeclineDialog-DeclineButton"]');
  }

  await buttonLocator.click();
  await expect(await buttonLocator.isVisible()).toBe(false);
}
