import { expect, test } from "@playwright/test";

import { takeScreenshot } from "../utils/general";
import { getSourceFileNameSearchResultsLocator, searchSourcesByName } from "../utils/source";
import { beforeEach } from "./beforeEach";

beforeEach();

test("should support fuzzy file search", async ({ page }, testInfo) => {
  const searchResultsLocator = getSourceFileNameSearchResultsLocator(page);
  await searchSourcesByName(page, "e");
  await takeScreenshot(page, testInfo, searchResultsLocator, "fuzzy-search-results-with-3-matches");
  await searchSourcesByName(page, "source");
  await takeScreenshot(page, testInfo, searchResultsLocator, "fuzzy-search-results-with-2-matches");
  await searchSourcesByName(page, "xyz");
  await expect(searchResultsLocator).not.toBeVisible();
});
