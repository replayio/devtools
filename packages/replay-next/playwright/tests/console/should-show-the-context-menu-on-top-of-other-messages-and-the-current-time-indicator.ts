import { test } from "@playwright/test";

import { locateMessage, openContextMenu, seekToMessage } from "../utils/console";
import { takeScreenshot } from "../utils/general";
import { beforeEach } from "./beforeEach";
import { setup } from "./shared";

beforeEach();

test("should show the context menu on top of other messages and the current time indicator", async ({
  page,
}, testInfo) => {
  await setup(page, true);

  const list = page.locator("[data-test-name=Messages]");

  let listItem = await locateMessage(page, "console-log", "This is a trace");
  await seekToMessage(page, listItem);

  listItem = await locateMessage(page, "console-log", "This is a log");
  await openContextMenu(page, listItem);
  await takeScreenshot(page, testInfo, list, "context-menu-position-one");

  await page.keyboard.press("Escape");

  listItem = await locateMessage(page, "console-error", "This is an error");
  await openContextMenu(page, listItem);
  await takeScreenshot(page, testInfo, list, "context-menu-position-two");
});
