import { test } from "@playwright/test";

import { filterByText } from "replay-next/playwright/tests/utils/console";

import { takeScreenshot } from "../utils/general";
import { addLogPoint } from "../utils/source";
import { beforeEach } from "./beforeEach";
import { sourceId } from "./shared";

beforeEach();

test("should include log points when filtering data", async ({ page }, testInfo) => {
  await addLogPoint(page, { sourceId, lineNumber: 13 });

  const messages = page.locator("[data-test-name=Messages]");

  await filterByText(page, "stack");
  await takeScreenshot(page, testInfo, messages, "log-point-in-search-results");

  await filterByText(page, "zzz");
  await takeScreenshot(page, testInfo, messages, "log-point-not-in-search-results");
});
