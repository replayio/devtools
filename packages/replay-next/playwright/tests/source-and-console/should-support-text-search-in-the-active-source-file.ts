import { expect, test } from "@playwright/test";

import { takeScreenshot } from "../utils/general";
import {
  getSearchSourceLocator,
  openSourceFile,
  searchSourceText,
  verifyCurrentSearchResult,
} from "../utils/source";
import { beforeEach } from "./beforeEach";
import { sourceId } from "./shared";

beforeEach();

test("should support text search in the active source file", async ({ page }, testInfo) => {
  await openSourceFile(page, sourceId);
  const sourceSearchLocator = getSearchSourceLocator(page);
  await expect(sourceSearchLocator).not.toBeVisible();
  await searchSourceText(page, "function");
  await verifyCurrentSearchResult(page, { fileName: "source-and-console.html", lineNumber: 17 });
  await takeScreenshot(page, testInfo, sourceSearchLocator, "source-search-results");
  await page.keyboard.press("Shift+Enter");
  await verifyCurrentSearchResult(page, { fileName: "source-and-console.html", lineNumber: 51 });
  await takeScreenshot(page, testInfo, sourceSearchLocator, "source-search-last-result-active");
  await page.keyboard.press("Enter");
  await verifyCurrentSearchResult(page, { fileName: "source-and-console.html", lineNumber: 17 });
  await takeScreenshot(page, testInfo, sourceSearchLocator, "source-search-first-result-active");
  await page.keyboard.press("Escape");
  await expect(sourceSearchLocator).not.toBeVisible();
});
