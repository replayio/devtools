import { test } from "@playwright/test";

import { takeScreenshot } from "../utils/general";
import {
  getSourceSearchResultsLocator,
  searchSources,
  toggleIncludeNodeModulesCheckbox,
  verifySourceSearchMatchingLocations,
  verifySourceSearchSummary,
  verifyVisibleResultsCount,
} from "../utils/source-search";
import { beforeEach } from "./beforeEach";

beforeEach();

test("should find matches in multiple sources", async ({ page }) => {
  await toggleIncludeNodeModulesCheckbox(page, true);
  await searchSources(page, "function t");
  await verifySourceSearchSummary(page, "3 results");
  await verifyVisibleResultsCount(page, 6);
  await verifySourceSearchMatchingLocations(page, ["1", "2", "h1"]);
  await takeScreenshot(page, getSourceSearchResultsLocator(page), "3-search-results-in-3-sources");
});
