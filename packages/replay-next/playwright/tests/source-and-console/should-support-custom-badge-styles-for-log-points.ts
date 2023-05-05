import { test } from "@playwright/test";

import { openContextMenu, toggleProtocolMessages } from "../utils/console";
import { takeScreenshot } from "../utils/general";
import { addLogPoint } from "../utils/source";
import { beforeEach } from "./beforeEach";
import { sourceId } from "./shared";

beforeEach();

test("should support custom badge styles for log points", async ({ page }) => {
  await addLogPoint(page, { sourceId, lineNumber: 13 });

  await toggleProtocolMessages(page, false);

  const message = page.locator("[data-test-name=Message]");

  await openContextMenu(page, message);
  await page.click("[data-test-id=ConsoleContextMenu-Badge-yellow]");
  await takeScreenshot(page, message, "log-point-message-with-yellow-badge");

  await openContextMenu(page, message);
  await page.click("[data-test-id=ConsoleContextMenu-Badge-unicorn]");
  await takeScreenshot(page, message, "log-point-message-with-unicorn-badge");
});
