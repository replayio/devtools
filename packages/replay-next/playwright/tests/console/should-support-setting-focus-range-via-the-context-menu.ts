import { expect, test } from "@playwright/test";

import { locateMessage, messageLocator, openContextMenu } from "../utils/console";
import { stopHovering, takeScreenshot } from "../utils/general";
import { beforeEach } from "./beforeEach";
import { setup } from "./shared";

beforeEach();

test("should support setting focus range via the context menu", async ({ page }) => {
  await setup(page, true);

  const list = page.locator("[data-test-name=Messages]");
  let listItem;

  listItem = await locateMessage(page, "console-warning", "This is a warning");
  await openContextMenu(page, listItem);
  await page.click("[data-test-id=ConsoleContextMenu-SetFocusStartButton]");
  await stopHovering(page);
  // Give the UI time to settle.
  await expect(messageLocator(page, "console-log", "This is a log")).toBeHidden();
  await takeScreenshot(page, list, "context-menu-focus-after-start");

  listItem = await locateMessage(page, "console-error", "This is an error");
  await openContextMenu(page, listItem);
  await stopHovering(page);
  await page.click("[data-test-id=ConsoleContextMenu-SetFocusEndButton]");
  // Give the UI time to settle.
  await expect(messageLocator(page, "console-log", "This is a trace")).toBeHidden();
  await takeScreenshot(page, list, "context-menu-focus-after-end");
});
