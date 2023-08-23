import { expect, test } from "@playwright/test";

import { takeScreenshot, typeCommandKey } from "../utils/general";
import {
  focusOnSource,
  getSearchSourceLocator,
  getSourceLocator,
  openSourceFile,
  searchSourceText,
  verifyCurrentSearchResult,
} from "../utils/source";
import { beforeEach } from "./beforeEach";
import { sourceId } from "./shared";

beforeEach();

test("should hide results when search is closed, and remember previous search string if re-opened", async ({
  page,
}, testInfo) => {
  await openSourceFile(page, sourceId);
  const sourceSearchLocator = getSearchSourceLocator(page);
  await expect(sourceSearchLocator).not.toBeVisible();
  await searchSourceText(page, "function");
  await verifyCurrentSearchResult(page, {
    fileName: "source-and-console.html",
    lineNumber: 17,
    sourceId,
  });

  const sourceLocator = getSourceLocator(page, sourceId);
  await takeScreenshot(page, testInfo, sourceLocator, "source-search-highlights");

  await page.keyboard.press("Escape");
  await expect(sourceSearchLocator).not.toBeVisible();

  await focusOnSource(page);
  await typeCommandKey(page, "f");

  await verifyCurrentSearchResult(page, {
    fileName: "source-and-console.html",
    lineNumber: 17,
    sourceId,
  });
  await takeScreenshot(page, testInfo, sourceLocator, "source-search-highlights");
});
