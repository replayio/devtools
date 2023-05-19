import { test } from "@playwright/test";

import { locateMessage } from "../utils/console";
import { takeScreenshot } from "../utils/general";
import { beforeEach } from "./beforeEach";
import { setup } from "./shared";

beforeEach();

test("should support terminal expressions with line breaks", async ({ page }, testInfo) => {
  await setup(page);

  await page.fill("[data-test-id=ConsoleTerminalInput]", '"Line 1\\nLine 2"');
  await page.keyboard.press("Enter");

  const newListItem = await locateMessage(page, "terminal-expression");
  await takeScreenshot(page, testInfo, newListItem, "terminal-expression-with-line-breaks");
});
