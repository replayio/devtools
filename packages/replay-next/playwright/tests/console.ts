import { Page, expect, test } from "@playwright/test";

import {
  addTerminalExpression,
  hideSearchInput,
  locateMessage,
  messageLocator,
  openContextMenu,
  seekToMessage,
  showSearchInput,
  toggleProtocolMessage,
  toggleProtocolMessages,
  toggleSideMenu,
} from "./utils/console";
import {
  delay,
  getCommandKey,
  getElementCount,
  getTestUrl,
  stopHovering,
  takeScreenshot,
} from "./utils/general";
import testSetup from "./utils/testSetup";

testSetup("4ccc9f9f-f0d3-4418-ac21-1b316e462a44");

async function setup(page: Page, toggleState: boolean | null = null) {
  await page.goto(getTestUrl("console"));

  if (typeof toggleState === "boolean") {
    await toggleProtocolMessages(page, toggleState);
    await toggleProtocolMessage(page, "nodeModules", toggleState);
  }

  await toggleProtocolMessage(page, "timestamps", false);
}

test.beforeEach(async ({ page }) => {
  page.setDefaultTimeout(5000);
});

test("should show the context menu on top of other messages and the current time indicator", async ({
  page,
}) => {
  await setup(page, true);

  const list = page.locator("[data-test-name=Messages]");

  let listItem = await locateMessage(page, "console-log", "This is a trace");
  await seekToMessage(page, listItem);

  listItem = await locateMessage(page, "console-log", "This is a trace");
  await openContextMenu(listItem);
  // Change
  await takeScreenshot(page, listItem, "context-menu-position-one");

  await page.keyboard.press("Escape");

  listItem = await locateMessage(page, "console-error", "This is an error");
  await openContextMenu(listItem);
  // Delete
  // await takeScreenshot(page, list, "context-menu-position-two");

  // Add
  await takeScreenshot(page, listItem, "context-menu-position-two-new-image");
});
