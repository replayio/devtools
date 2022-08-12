import { Locator, Page } from "@playwright/test";
import { getElementCount } from "./general";

type ToggleName = "errors" | "exceptions" | "logs" | "nodeModules" | "timestamps" | "warnings";

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

export async function toggleProtocolMessages(page: Page, on: boolean) {
  await toggleProtocolMessage(page, "errors", on);
  await toggleProtocolMessage(page, "exceptions", on);
  await toggleProtocolMessage(page, "logs", on);
  await toggleProtocolMessage(page, "warnings", on);
}

export async function toggleProtocolMessage(page: Page, name: ToggleName, on: boolean) {
  await page.waitForSelector(`[data-test-id="FilterToggle-${name}"] input`);

  const isEnabled = await page.evaluate(
    name => {
      const input = document.querySelector(`[data-test-id="FilterToggle-${name}"] input`);
      return (input as HTMLInputElement).checked;
    },
    [name]
  );

  if ((isEnabled && !on) || (!isEnabled && on)) {
    await page.click(`[data-test-id="FilterToggle-${name}"]`);
  }
}
