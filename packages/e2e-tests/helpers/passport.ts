import { Page } from "@playwright/test";

export async function showPassport(page: Page) {
  const passportTab = page.locator("button.toolbar-panel-button.passport");
  await passportTab.waitFor();
  const pressed = await passportTab.getAttribute("aria-pressed");
  if (pressed !== "true") {
    await passportTab.click();
  }
}

export async function isPassportItemCompleted(page: Page, itemText: string) {
  await showPassport(page);
  const item = page.locator(`[data-test-name="PassportItem"]:has-text("${itemText}")`);
  const completed = await item.getAttribute("data-test-completed");
  return completed === "true";
}
