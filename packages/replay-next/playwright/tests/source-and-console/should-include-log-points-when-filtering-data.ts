import { test } from "@playwright/test";

import { takeScreenshot } from "../utils/general";
import { addLogPoint } from "../utils/source";
import { beforeEach } from "./beforeEach";
import { sourceId } from "./shared";

beforeEach();

test("should include log points when filtering data", async ({ page }) => {
  await addLogPoint(page, { sourceId, lineNumber: 13 });

  await page.fill("[data-test-id=ConsoleFilterInput]", "stack");
  const messages = page.locator("[data-test-name=Messages]");
  await takeScreenshot(page, messages, "log-point-in-search-results");

  await page.fill("[data-test-id=ConsoleFilterInput]", "zzz");
  await takeScreenshot(page, messages, "log-point-not-in-search-results");
});
