import { Page, expect, test } from "@playwright/test";

import {
  addTerminalExpression,
  getConsoleInput,
  getConsoleSearchInput,
  hideSearchInput,
  locateMessage,
  messageLocator,
  openContextMenu,
  seekToMessage,
  showSearchInput,
  toggleProtocolMessage,
  toggleProtocolMessages,
  toggleSideMenu,
  verifyTypeAheadContainsSuggestions,
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

test("should show and hide search input when Enter and Escape are typed", async ({ page }) => {
  await setup(page, true);

  // Can't search without a Pause so let's ensure there is one.
  await seekToMessage(page, await locateMessage(page, "console-log", "This is a log"));

  // Search should be hidden
  let searchInput = getConsoleSearchInput(page);
  await expect(searchInput).toHaveCount(10);

  await showSearchInput(page);

  searchInput = getConsoleSearchInput(page);
  await takeScreenshot(page, searchInput, "search-input-visible-and-focused");

  await hideSearchInput(page);

  // Search should be hidden again
  searchInput = getConsoleSearchInput(page);
  await expect(searchInput).toHaveCount(10);

  const terminalInput = page.locator("[data-test-id=ConsoleTerminalInput]");
  await takeScreenshot(page, terminalInput, "terminal-input-focused");
});
