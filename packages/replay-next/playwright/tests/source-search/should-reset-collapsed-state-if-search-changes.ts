import { test } from "@playwright/test";

import {
  searchSources,
  toggleExcludeNodeModulesCheckbox,
  toggleSearchResultsForFileName,
  verifyVisibleResultsCount,
} from "../utils/source-search";
import { beforeEach } from "./beforeEach";

beforeEach();

test("should reset collapsed state if search changes", async ({ page }, testInfo) => {
  await toggleExcludeNodeModulesCheckbox(page, false);
  await searchSources(page, "function t");
  await verifyVisibleResultsCount(page, 6);
  await toggleSearchResultsForFileName(page, false, { fileName: "react-is.development.js" });
  await verifyVisibleResultsCount(page, 5);

  await searchSources(page, "function type");
  await verifyVisibleResultsCount(page, 2);
});
