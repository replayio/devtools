import { expect, test } from "@playwright/test";

import { toggleExpandable } from "replay-next/playwright/tests/utils/inspector";

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
} from "../utils/console";
import { delay, getElementCount, stopHovering, takeScreenshot } from "../utils/general";
import { beforeEach } from "./beforeEach";
import { setup } from "./shared";

beforeEach("27a42866-ffd6-4f74-8813-c4feb2b78b6c");

test("should show error object stacks by default", async ({ page }, testInfo) => {
  await setup(page);
  await toggleProtocolMessage(page, "errors", true);

  const listItem = await locateMessage(page, "console-error", "This is an error object");
  await takeScreenshot(page, testInfo, listItem, "error-object-stack");

  const toggle = listItem.locator("[role=button]", { hasText: "This is an error object" });
  await toggle.click();
  await takeScreenshot(page, testInfo, listItem, "error-object-stack-expanded");
});
