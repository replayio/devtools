import { test } from "@playwright/test";

import { getTestUrl, takeScreenshot } from "../utils/general";
import {
  addLogPoint,
  getSourceLineContentsLocator,
  openSourceFile,
  searchSourceText,
  waitForSourceLineHitCounts,
} from "../utils/source";
import { beforeEach } from "./beforeEach";
import { sourceId } from "./shared";

beforeEach();

test("should account for column breakpoints with plain text", async ({ page }) => {
  await page.goto(getTestUrl("source-and-console", ["disableSyntaxHighlighting"]));
  await openSourceFile(page, sourceId);

  await searchSourceText(page, "if (--");

  await waitForSourceLineHitCounts(page, sourceId, 20);
  const lineContents = getSourceLineContentsLocator(page, sourceId, 20);
  await takeScreenshot(page, lineContents, "search-result-highlight-plaintext");

  // Add log point panel (which will insert a column breakpoint)
  await addLogPoint(page, { sourceId, lineNumber: 20 });
  await takeScreenshot(
    page,
    lineContents,
    "search-result-highlight-plaintext-with-column-breakpoint"
  );
});
