import { expect, test } from "@playwright/test";

import { toggleProtocolMessage } from "../utils/console";
import { takeScreenshot } from "../utils/general";
import { beforeEach } from "./beforeEach";
import { setup } from "./shared";

beforeEach();

test("should display list of messages", async ({ page }) => {
  await setup(page, true);

  const list = page.locator("[data-test-name=Messages]");
  await expect(list).toContainText("This is a log");
  await expect(list).toContainText("This is a warning");
  await expect(list).toContainText("This is an error");
  await expect(list).toContainText("Uncaught exception");
  await toggleProtocolMessage(page, "timestamps", false);

  await takeScreenshot(page, list, "message-list");

  await toggleProtocolMessage(page, "timestamps", true);
  await takeScreenshot(page, list, "message-list-with-timestamps");
});
