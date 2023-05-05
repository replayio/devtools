import { Locator, Page } from "@playwright/test";

import {
  findContextMenuItem,
  showContextMenu,
} from "replay-next/playwright/tests/utils/context-menu";

import { filterByText, locateMessage } from "../utils/console";
import { waitFor } from "../utils/general";

export type LocatorFunction = (
  page: Page,
  partialText: string,
  locator: Locator | null
) => Promise<Locator>;

export async function verifyClipboardText(page: Page, expectedValue: string): Promise<void> {
  await waitFor(async () => {
    const actualText = await page.evaluate(() => navigator.clipboard.readText());
    if (actualText !== expectedValue) {
      throw `Expected clipboard to contain "${expectedValue}" but found "${actualText}"`;
    }
  });
}

export async function verifyContextMenuCopy(
  page: Page,
  locatorFunction: LocatorFunction,
  filterText: string,
  inspectorText: string,
  copyLabel: string,
  expectedValue: string
): Promise<void> {
  await filterByText(page, filterText);

  const listItems = await locateMessage(page, "console-log", filterText);
  const listItem = listItems.first();

  const inspectorItems = await locatorFunction(page, inspectorText, listItem);
  const inspectorItem = inspectorItems.last();

  await showContextMenu(page, inspectorItem);

  const contextMenuItem = await findContextMenuItem(page, copyLabel);
  await contextMenuItem.click();

  await verifyClipboardText(page, expectedValue);
}
