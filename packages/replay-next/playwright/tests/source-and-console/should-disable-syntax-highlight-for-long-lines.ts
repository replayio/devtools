import { test } from "@playwright/test";

import { takeScreenshot } from "../utils/general";
import { getSourceLineLocator, openSourceFile } from "../utils/source";
import { beforeEach } from "./beforeEach";
import { sourceId } from "./shared";

beforeEach("350c08ae-c1ba-4043-8f23-8d71c897563d", ["disableSyntaxHighlightingOverLength=60"]);

test("should disable syntax highlight for long lines", async ({ page }, testInfo) => {
  await openSourceFile(page, sourceId);

  await takeScreenshot(
    page,
    testInfo,
    getSourceLineLocator(page, sourceId, 1),
    "line-with-syntax-highlight-enabled"
  );

  await takeScreenshot(
    page,
    testInfo,
    getSourceLineLocator(page, sourceId, 5),
    "line-with-syntax-highlight-disabled"
  );
});
