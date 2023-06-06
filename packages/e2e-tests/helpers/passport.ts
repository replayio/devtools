import { Page } from "@playwright/test";

export async function showPassport(page: Page) {
  const passportButton = page.locator(".toolbar-panel-button.passport");
  const classes = await passportButton.getAttribute("class");
  if (!classes?.includes("active")) {
    await passportButton.click();
  }
}

export async function isPassportItemCompleted(page: Page, itemText: string) {
  await showPassport(page);
  const item = page.locator(`[data-test-name="PassportItem"]:has-text("${itemText}")`);
  const completed = await item.getAttribute("data-test-completed");
  return completed === "true";
}
