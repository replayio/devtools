import { test } from "@playwright/test";

import { takeScreenshot } from "../utils/general";
import {
  getSourceSearchResultsLocator,
  searchSources,
  toggleExcludeNodeModulesCheckbox,
  toggleSearchResultsForFileName,
  verifySourceSearchSummary,
  verifyVisibleResultsCount,
} from "../utils/source-search";
import { beforeEach } from "./beforeEach";

beforeEach();

test("should expand and collapse sources", async ({ page }, testInfo) => {
  await toggleExcludeNodeModulesCheckbox(page, false);
  await searchSources(page, "function t");
  await verifySourceSearchSummary(page, "3 results in 3 files");
  await verifyVisibleResultsCount(page, 6);
  await takeScreenshot(
    page,
    testInfo,
    getSourceSearchResultsLocator(page),
    "3-search-results-in-3-sources"
  );

  await toggleSearchResultsForFileName(page, false, { sourceId: "2" });
  await verifyVisibleResultsCount(page, 5);
  await takeScreenshot(
    page,
    testInfo,
    getSourceSearchResultsLocator(page),
    "3-search-results-in-3-sources-1st-source-collapsed"
  );

  await toggleSearchResultsForFileName(page, false, { sourceId: "h1" });
  await toggleSearchResultsForFileName(page, false, { sourceId: "1" });
  await verifyVisibleResultsCount(page, 3);
  await takeScreenshot(
    page,
    testInfo,
    getSourceSearchResultsLocator(page),
    "3-search-results-in-3-sources-all-sources-collapsed"
  );

  await toggleSearchResultsForFileName(page, true, { sourceId: "2" });
  await verifyVisibleResultsCount(page, 4);
  await takeScreenshot(
    page,
    testInfo,
    getSourceSearchResultsLocator(page),
    "3-search-results-in-3-sources-last-two-sources-collapsed"
  );

  await toggleSearchResultsForFileName(page, true, { sourceId: "h1" });
  await toggleSearchResultsForFileName(page, true, { sourceId: "1" });
  await verifySourceSearchSummary(page, "3 results in 3 files");
  await verifyVisibleResultsCount(page, 6);
  await takeScreenshot(
    page,
    testInfo,
    getSourceSearchResultsLocator(page),
    "3-search-results-in-3-sources"
  );
});
