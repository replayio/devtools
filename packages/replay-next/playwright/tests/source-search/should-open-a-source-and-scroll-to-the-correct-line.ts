import { test } from "@playwright/test";

import { verifyCurrentSearchResult } from "../utils/source";
import {
  clickSearchResultRow,
  searchSources,
  toggleExcludeNodeModulesCheckbox,
  verifySourceSearchSummary,
  verifyVisibleResultsCount,
} from "../utils/source-search";
import { beforeEach } from "./beforeEach";

beforeEach();

test("should open a source and scroll to the correct line", async ({ page }, testInfo) => {
  await toggleExcludeNodeModulesCheckbox(page, false);
  await searchSources(page, "function t");
  await verifySourceSearchSummary(page, "3 results in 1 file");
  await verifyVisibleResultsCount(page, 6);

  await clickSearchResultRow(page, 6);
  await verifyCurrentSearchResult(page, {
    fileName: "react-is.development.js",
    lineNumber: 76,
    sourceId: "1",
  });

  await clickSearchResultRow(page, 2);
  await verifyCurrentSearchResult(page, {
    fileName: "source-and-console.html",
    lineNumber: 47,
    sourceId: "2",
  });
});
