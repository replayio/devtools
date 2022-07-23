import { Locator, Page } from "@playwright/test";
import { getElementCount } from "./general";

export async function hideProtocolMessages(page: Page) {
  await page.click('[data-test-id="FilterToggle-exceptions"]');
  await page.click('[data-test-id="FilterToggle-errors"]');
  await page.click('[data-test-id="FilterToggle-logs"]');
  await page.click('[data-test-id="FilterToggle-warnings"]');
}

export async function hideSearchInput(page: Page) {
  const count = await getElementCount(page, '[data-test-id="ConsoleSearchInput"]');
  if (count > 0) {
    await page.focus('[data-test-id="ConsoleSearchInput"]');
    await page.keyboard.press("Escape");
  }
}

export async function seekToMessage(page: Page, messageListItem: Locator) {
  await messageListItem.hover();
  await page.click('[data-test-id="ConsoleMessageHoverButton"]');
}

export async function showSearchInput(page: Page) {
  // If already visible, just ensure we're focused in it.
  const count = await getElementCount(page, '[data-test-id="ConsoleSearchInput"]');
  if (count > 0) {
    await page.focus('[data-test-id="ConsoleSearchInput"]');
  } else {
    await page.focus('[data-test-id="ConsoleTerminalInput"]');
    await page.keyboard.down("Meta");
    await page.keyboard.type("f");
    await page.keyboard.up("Meta");
  }
}
