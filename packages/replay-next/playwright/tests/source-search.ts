import { test } from "@playwright/test";

import { getTestUrl, takeScreenshot } from "./utils/general";
import { verifyCurrentSearchResult } from "./utils/source";
import {
  clickSearchResultRow,
  getSourceSearchResultsLocator,
  searchSources,
  toggleIncludeNodeModulesCheckbox,
  toggleSearchResultsForFileName,
  verifySourceSearchMatchingLocations,
  verifySourceSearchOverflowMessageShown,
  verifySourceSearchSummary,
  verifyVisibleResultsCount,
} from "./utils/source-search";
import testSetup from "./utils/testSetup";

testSetup("c9fffa00-ac71-48bc-adb2-52ae81588e85");

test.beforeEach(async ({ page }) => {
  page.setDefaultTimeout(5000);

  await page.goto(getTestUrl("source-search"));
});

test("should find matches in multiple sources", async ({ page }) => {
  await toggleIncludeNodeModulesCheckbox(page, true);
  await searchSources(page, "function t");
  await verifySourceSearchSummary(page, "3 results");
  await verifyVisibleResultsCount(page, 6);
  await verifySourceSearchMatchingLocations(page, ["1", "2", "h1"]);
  await takeScreenshot(page, getSourceSearchResultsLocator(page), "3-search-results-in-3-sources");
});

test("should expand and collapse sources", async ({ page }) => {
  await toggleIncludeNodeModulesCheckbox(page, true);
  await searchSources(page, "function t");
  await verifySourceSearchSummary(page, "3 results");
  await verifyVisibleResultsCount(page, 6);
  await takeScreenshot(page, getSourceSearchResultsLocator(page), "3-search-results-in-3-sources");

  await toggleSearchResultsForFileName(page, false, { sourceId: "2" });
  await verifyVisibleResultsCount(page, 5);
  await takeScreenshot(
    page,
    getSourceSearchResultsLocator(page),
    "3-search-results-in-3-sources-1st-source-collapsed"
  );

  await toggleSearchResultsForFileName(page, false, { sourceId: "h1" });
  await toggleSearchResultsForFileName(page, false, { sourceId: "1" });
  await verifyVisibleResultsCount(page, 3);
  await takeScreenshot(
    page,
    getSourceSearchResultsLocator(page),
    "3-search-results-in-3-sources-all-sources-collapsed"
  );

  await toggleSearchResultsForFileName(page, true, { sourceId: "2" });
  await verifyVisibleResultsCount(page, 4);
  await takeScreenshot(
    page,
    getSourceSearchResultsLocator(page),
    "3-search-results-in-3-sources-last-two-sources-collapsed"
  );

  await toggleSearchResultsForFileName(page, true, { sourceId: "h1" });
  await toggleSearchResultsForFileName(page, true, { sourceId: "1" });
  await verifySourceSearchSummary(page, "3 results");
  await verifyVisibleResultsCount(page, 6);
  await takeScreenshot(page, getSourceSearchResultsLocator(page), "3-search-results-in-3-sources");
});

test("should reset collapsed state if search changes", async ({ page }) => {
  await toggleIncludeNodeModulesCheckbox(page, true);
  await searchSources(page, "function t");
  await verifyVisibleResultsCount(page, 6);
  await toggleSearchResultsForFileName(page, false, { fileName: "react-is.development.js" });
  await verifyVisibleResultsCount(page, 5);

  await searchSources(page, "function type");
  await verifyVisibleResultsCount(page, 2);
});

test("display an overflow message", async ({ page }) => {
  await toggleIncludeNodeModulesCheckbox(page, true);
  await searchSources(page, "e");
  await verifySourceSearchSummary(page, "first 50 results");
  await verifySourceSearchOverflowMessageShown(page, true);
});

test("should include or exclude external modules as requested", async ({ page }) => {
  await toggleIncludeNodeModulesCheckbox(page, false);
  await searchSources(page, "react");
  await verifySourceSearchSummary(page, "4 results");
  await verifySourceSearchMatchingLocations(page, ["2", "h1"]);

  await toggleIncludeNodeModulesCheckbox(page, true);
  await verifySourceSearchSummary(page, "first 50 results");
  await verifySourceSearchMatchingLocations(page, ["1", "2", "h1"]);

  await toggleIncludeNodeModulesCheckbox(page, false);
  await verifySourceSearchSummary(page, "4 results");
  await verifySourceSearchMatchingLocations(page, ["2", "h1"]);
});

test("should open a source and scroll to the correct line", async ({ page }) => {
  await toggleIncludeNodeModulesCheckbox(page, true);
  await searchSources(page, "function t");
  await verifySourceSearchSummary(page, "3 results");
  await verifyVisibleResultsCount(page, 6);

  await clickSearchResultRow(page, 6);
  await verifyCurrentSearchResult(page, { fileName: "react-is.development.js", lineNumber: 76 });
  await clickSearchResultRow(page, 2);
  await verifyCurrentSearchResult(page, { fileName: "source-and-console.html", lineNumber: 47 });
});
