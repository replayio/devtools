import { Page } from "@playwright/test";

export async function showPassport(page: Page) {
  const passportTab = page.locator(".toolbar-panel-button.passport");
  await passportTab.waitFor();
  const classes = await passportTab.getAttribute("class");
  if (!classes?.includes("active")) {
    const passportButton = passportTab.locator("button");
    await passportButton.isEnabled();
    await passportButton.click();
  }
}

export async function isPassportItemCompleted(page: Page, itemText: string) {
  await showPassport(page);
  const item = page.locator(`[data-test-name="PassportItem"]:has-text("${itemText}")`);
  const completed = await item.getAttribute("data-test-completed");
  return completed === "true";
}
