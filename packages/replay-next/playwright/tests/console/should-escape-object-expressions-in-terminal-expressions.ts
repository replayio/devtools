import { test } from "@playwright/test";

import {
  locateMessage,
  seekToMessage,
  toggleProtocolMessage,
  toggleProtocolMessages,
} from "../utils/console";
import { takeScreenshot } from "../utils/general";
import { beforeEach } from "./beforeEach";
import { setup } from "./shared";

beforeEach();

test("should escape object expressions in terminal expressions", async ({ page }) => {
  await setup(page);

  await toggleProtocolMessage(page, "logs", true);

  const listItem = await locateMessage(page, "console-log", "This is a log");
  await seekToMessage(page, listItem);

  await toggleProtocolMessages(page, false);

  // Add some expressions (local and remote)
  await page.fill("[data-test-id=ConsoleTerminalInput]", '{foo: "bar"}');
  await page.keyboard.press("Enter");
  await page.fill("[data-test-id=ConsoleTerminalInput]", '{"href": location.href}');
  await page.keyboard.press("Enter");

  const list = page.locator("[data-test-name=Messages]");
  await takeScreenshot(page, list, "auto-escaped-terminal-expressions");
});
