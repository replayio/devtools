import { test } from "@playwright/test";

import {
  searchSources,
  toggleIncludeNodeModulesCheckbox,
  verifySourceSearchMatchingLocations,
  verifySourceSearchSummary,
} from "../utils/source-search";
import { beforeEach } from "./beforeEach";

beforeEach();

test("should include or exclude external modules as requested", async ({ page }, testInfo) => {
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
