import { test } from "@playwright/test";

import { locateMessage, searchByText, seekToMessage, showSearchInput } from "../utils/console";
import { takeScreenshot } from "../utils/general";
import { beforeEach } from "./beforeEach";
import { setup } from "./shared";

beforeEach();

test("should be searchable on complex content", async ({ page }, testInfo) => {
  await setup(page, true);

  // Can't search without a Pause so let's ensure there is one.
  await seekToMessage(page, await locateMessage(page, "console-log", "This is a log"));

  await showSearchInput(page);

  await searchByText(page, "(3) [1, 2, 3]");

  const consoleRoot = page.locator("[data-test-id=ConsoleRoot]");
  await takeScreenshot(page, testInfo, consoleRoot, "searchable-complex-array-preview");

  await searchByText(page, "number: 123, string:");
  await takeScreenshot(page, testInfo, consoleRoot, "searchable-complex-object-preview");
});
