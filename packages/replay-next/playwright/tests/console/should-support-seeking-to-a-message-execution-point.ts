import { test } from "@playwright/test";

import { locateMessage, seekToMessage, toggleProtocolMessage } from "../utils/console";
import { takeScreenshot } from "../utils/general";
import { beforeEach } from "./beforeEach";
import { setup } from "./shared";

beforeEach();

test("should support seeking to a message execution point", async ({ page }) => {
  await setup(page);
  await toggleProtocolMessage(page, "logs", true);

  const list = page.locator("[data-test-name=Messages]");

  // Fast-forward
  const laterListItem = await locateMessage(page, "console-log", "This is a trace");
  await seekToMessage(page, laterListItem);
  await takeScreenshot(page, list, "message-list-seek-to-later-message");

  // Rewind
  const earlierListItem = await locateMessage(page, "console-log", "This is a log");
  await seekToMessage(page, earlierListItem);
  await takeScreenshot(page, list, "message-list-seek-to-earlier-message");
});
