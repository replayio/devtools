import { test } from "@playwright/test";

import { takeScreenshot } from "../utils/general";
import { getSourceLineLocator, openSourceFile, waitForSourceLineHitCounts } from "../utils/source";
import { beforeEach } from "./beforeEach";
import { sourceId } from "./shared";

beforeEach("350c08ae-c1ba-4043-8f23-8d71c897563d", ["disableSyntaxHighlightingOverLength=60"]);

test("should disable syntax highlight for long lines", async ({ page }, testInfo) => {
  await openSourceFile(page, sourceId);

  await waitForSourceLineHitCounts(page, sourceId, 1);

  await takeScreenshot(
    page,
    testInfo,
    getSourceLineLocator(page, sourceId, 1),
    "line-with-syntax-highlight-enabled"
  );

  await waitForSourceLineHitCounts(page, sourceId, 5);

  await takeScreenshot(
    page,
    testInfo,
    getSourceLineLocator(page, sourceId, 5),
    "line-with-syntax-highlight-disabled"
  );
});
