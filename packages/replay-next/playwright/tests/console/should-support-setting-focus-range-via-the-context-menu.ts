import { expect, test } from "@playwright/test";

import { locateMessage, messageLocator, openContextMenu } from "../utils/console";
import { stopHovering, takeScreenshot, waitFor } from "../utils/general";
import { beforeEach } from "./beforeEach";
import { setup } from "./shared";

beforeEach();

test("should support setting focus range via the context menu", async ({ page }, testInfo) => {
  await setup(page, true);

  const list = page.locator("[data-test-name=Messages]");
  let listItem;

  const messages = list.locator("[data-test-name=Message]");
  await waitFor(async () => expect(await messages.count()).toBe(11));

  listItem = await locateMessage(page, "console-warning", "This is a warning");
  await openContextMenu(page, listItem);
  await page.click("[data-test-id=ConsoleContextMenu-SetFocusStartButton]");
  await stopHovering(page);
  // Give the UI time to settle.
  await waitFor(async () => expect(await messages.count()).toBe(9));
  await takeScreenshot(page, testInfo, list, "context-menu-focus-after-start");

  listItem = await locateMessage(page, "console-error", "This is an error");
  await openContextMenu(page, listItem);
  await stopHovering(page);
  await page.click("[data-test-id=ConsoleContextMenu-SetFocusEndButton]");
  // Give the UI time to settle.
  await waitFor(async () => expect(await messages.count()).toBe(2));
  await takeScreenshot(page, testInfo, list, "context-menu-focus-after-end");
});
