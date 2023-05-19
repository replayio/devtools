import { test } from "@playwright/test";

import { locateMessage, seekToMessage, toggleProtocolMessage } from "../utils/console";
import { delay, takeScreenshot } from "../utils/general";
import { beforeEach } from "./beforeEach";
import { setup } from "./shared";

beforeEach();

test("should evaluate terminal expressions at an execution point", async ({ page }, testInfo) => {
  await setup(page);
  await toggleProtocolMessage(page, "logs", true);

  const listItem = await locateMessage(page, "console-log", "This is a log");
  await seekToMessage(page, listItem);

  await page.fill("[data-test-id=ConsoleTerminalInput]", "location.hre");
  await delay(500); // HACK Give the type-ahead data time to load
  await page.keyboard.press("Enter"); // Accept "href" suggestion
  await page.keyboard.press("Enter"); // Submit expression

  const newListItem = await locateMessage(page, "terminal-expression");
  await takeScreenshot(page, testInfo, newListItem, "terminal-expression-at-execution-point");
});
