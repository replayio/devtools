import { test } from "@playwright/test";

import { locateMessage, seekToMessage, showSearchInput } from "../utils/console";
import { takeScreenshot } from "../utils/general";
import { beforeEach } from "./beforeEach";
import { setup } from "./shared";

beforeEach();

test("should be searchable on complex content", async ({ page }) => {
  await setup(page, true);

  // Can't search without a Pause so let's ensure there is one.
  await seekToMessage(page, await locateMessage(page, "console-log", "This is a log"));

  await showSearchInput(page);

  await page.fill("[data-test-id=ConsoleSearchInput]", "(3) [1, 2, 3]");

  const consoleRoot = page.locator("[data-test-id=ConsoleRoot]");
  await takeScreenshot(page, consoleRoot, "searchable-complex-array-preview");

  await page.fill("[data-test-id=ConsoleSearchInput]", "number: 123, string:");
  await takeScreenshot(page, consoleRoot, "searchable-complex-object-preview");
});
