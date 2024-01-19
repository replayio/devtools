import { expect, test } from "@playwright/test";

import { takeScreenshot, waitFor } from "../utils/general";
import {
  getSourceSearchResultsLocator,
  searchSources,
  toggleExcludeNodeModulesCheckbox,
  verifySourceSearchMatchingLocations,
  verifySourceSearchSummary,
  verifyVisibleResultsCount,
} from "../utils/source-search";
import { beforeEach } from "./beforeEach";

beforeEach();

test("should find matches in multiple sources", async ({ page }, testInfo) => {
  await toggleExcludeNodeModulesCheckbox(page, false);
  await searchSources(page, "function t");
  await verifySourceSearchSummary(page, "3 results in 3 files");
  // wait for hit counts to be loaded
  await waitFor(async () =>
    expect(
      await page.locator('[data-test-name="SearchFiles-ResultRow"][data-hit-count="0"]').count()
    ).toBe(3)
  );
  await verifyVisibleResultsCount(page, 6);
  await verifySourceSearchMatchingLocations(page, ["1", "2", "h1"]);
  await takeScreenshot(
    page,
    testInfo,
    getSourceSearchResultsLocator(page),
    "3-search-results-in-3-sources"
  );
});
