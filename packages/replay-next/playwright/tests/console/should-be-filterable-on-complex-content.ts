import { test } from "@playwright/test";

import { takeScreenshot } from "../utils/general";
import { beforeEach } from "./beforeEach";
import { setup } from "./shared";

beforeEach();

test("should be filterable on complex content", async ({ page }, testInfo) => {
  await setup(page, true);

  await page.fill("[data-test-id=ConsoleFilterInput]", "(3) [1, 2, 3]");
  const consoleRoot = page.locator("[data-test-id=ConsoleRoot]");
  await takeScreenshot(page, testInfo, consoleRoot, "filtered-complex-array-preview");

  await page.fill("[data-test-id=ConsoleFilterInput]", "number: 123, string:");
  await takeScreenshot(page, testInfo, consoleRoot, "filtered-complex-object-preview");
});
