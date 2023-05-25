import { test } from "@playwright/test";

import { searchByText } from "replay-next/playwright/tests/utils/console";

import { takeScreenshot } from "../utils/general";
import { addLogPoint } from "../utils/source";
import { beforeEach } from "./beforeEach";
import { sourceId } from "./shared";

beforeEach();

test("should include log points in search results", async ({ page }, testInfo) => {
  await addLogPoint(page, { sourceId, lineNumber: 13 });

  await searchByText(page, "stack");
  const messages = page.locator("[data-test-name=Messages]");
  await takeScreenshot(page, testInfo, messages, "log-point-highlighted-as-search-result");
});
