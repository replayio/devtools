import { test } from "@playwright/test";

import {
  searchSources,
  toggleExcludeNodeModulesCheckbox,
  verifySourceSearchOverflowMessageShown,
  verifySourceSearchSummary,
} from "../utils/source-search";
import { beforeEach } from "./beforeEach";

beforeEach();

test("display an overflow message", async ({ page }, testInfo) => {
  await toggleExcludeNodeModulesCheckbox(page, false);
  await searchSources(page, "e");
  await verifySourceSearchSummary(page, "First 50 results");
  await verifySourceSearchOverflowMessageShown(page, true);
});
