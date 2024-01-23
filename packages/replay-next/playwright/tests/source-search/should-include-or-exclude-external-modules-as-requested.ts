import { test } from "@playwright/test";

import {
  searchSources,
  toggleExcludeNodeModulesCheckbox,
  verifySourceSearchMatchingLocations,
  verifySourceSearchSummary,
} from "../utils/source-search";
import { beforeEach } from "./beforeEach";

beforeEach();

test("should include or exclude external modules as requested", async ({ page }, testInfo) => {
  await toggleExcludeNodeModulesCheckbox(page, true);
  await searchSources(page, "react");
  await verifySourceSearchSummary(page, "4 results in 2 files");
  await verifySourceSearchMatchingLocations(page, ["2", "h1"]);

  await toggleExcludeNodeModulesCheckbox(page, false);
  await verifySourceSearchSummary(page, "First 50 results");
  await verifySourceSearchMatchingLocations(page, ["1", "2", "h1"]);

  await toggleExcludeNodeModulesCheckbox(page, true);
  await verifySourceSearchSummary(page, "4 results in 2 files");
  await verifySourceSearchMatchingLocations(page, ["2", "h1"]);
});
