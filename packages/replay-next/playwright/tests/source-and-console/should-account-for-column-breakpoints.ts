import { test } from "@playwright/test";

import { takeScreenshot } from "../utils/general";
import { addLogPoint, getSourceLineLocator, searchSourceText } from "../utils/source";
import { beforeEach } from "./beforeEach";
import { sourceId } from "./shared";

beforeEach();

test("should account for column breakpoints", async ({ page }, testInfo) => {
  await searchSourceText(page, "if (--");

  const lineLocator = getSourceLineLocator(page, sourceId, 20);
  await takeScreenshot(page, testInfo, lineLocator, "search-result-highlight");

  // Add log point panel (which will insert a column breakpoint)
  await addLogPoint(page, { sourceId, lineNumber: 20 });
  await takeScreenshot(
    page,
    testInfo,
    lineLocator,
    "search-result-highlight-with-column-breakpoint"
  );
});
