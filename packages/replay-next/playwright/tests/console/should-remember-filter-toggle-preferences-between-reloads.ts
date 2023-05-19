import { test } from "@playwright/test";

import { toggleProtocolMessage, toggleProtocolMessages } from "../utils/console";
import { takeScreenshot } from "../utils/general";
import { beforeEach } from "./beforeEach";
import { setup } from "./shared";

beforeEach();

test("should remember filter toggle preferences between reloads", async ({ page }, testInfo) => {
  await setup(page);

  // Toggle everything off and screenshot
  await toggleProtocolMessages(page, false);
  await toggleProtocolMessage(page, "nodeModules", false);
  await toggleProtocolMessage(page, "timestamps", false);
  let filters = page.locator("[data-test-id=ConsoleFilterToggles]");
  await takeScreenshot(page, testInfo, filters, "initial-side-filter-values");

  // Reload and verify screenshot unchanged
  await page.reload();
  filters = page.locator("[data-test-id=ConsoleFilterToggles]");
  await takeScreenshot(page, testInfo, filters, "initial-side-filter-values");

  // Toggle everything on and screenshot
  await toggleProtocolMessages(page, true);
  await toggleProtocolMessage(page, "nodeModules", true);
  await toggleProtocolMessage(page, "timestamps", true);
  await takeScreenshot(page, testInfo, filters, "updated-side-filter-values");

  // Reload and verify screenshot unchanged
  await page.reload();
  filters = page.locator("[data-test-id=ConsoleFilterToggles]");
  await takeScreenshot(page, testInfo, filters, "updated-side-filter-values");
});
