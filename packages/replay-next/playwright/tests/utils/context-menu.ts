import { Locator, Page } from "@playwright/test";

import { debugPrint, waitFor } from "./general";

export async function findContextMenuItem(page: Page, partialText: string): Promise<Locator> {
  await debugPrint(
    page,
    `Searching for context menu item with text "${partialText}"`,
    "findContextMenuItem"
  );

  return page.locator(`[data-test-name="ContextMenuItem"]`, { hasText: partialText });
}

export async function showContextMenu(page: Page, locator: Locator) {
  const textContent = await locator.textContent();

  await debugPrint(
    page,
    `Showing context menu for element containing "${textContent}`,
    "showContextMenu"
  );

  await locator.click({ button: "right", force: true });

  const contextMenu = page.locator('[data-test-name="ContextMenu"]');

  await waitFor(async () => {
    const count = await contextMenu.count();
    if (count !== 1) {
      throw `Expected context menu to be visible`;
    }
  });
}
