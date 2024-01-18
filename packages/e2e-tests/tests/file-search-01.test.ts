import { openDevToolsTab, startTest } from "../helpers";
import {
  openFileSearchPanel,
  searchSources,
  toggleExcludeNodeModulesCheckbox,
  toggleSearchResultsForFileName,
  verifyMatchExecuted,
  verifySourceSearchOverflowMessageShown,
  verifySourceSearchSummary,
  verifyVisibleResultsCount,
} from "../helpers/file-search";
import test from "../testFixtureCloneRecording";

test.use({ exampleKey: "cra/dist/index_chromium.html" });

test("file-search-01: should search files", async ({ pageWithMeta: { page, recordingId } }) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);
  await openFileSearchPanel(page);

  // Verify message shown at first
  await verifySourceSearchSummary(page, "");

  // Verify overflow message
  await searchSources(page, "a");
  await verifySourceSearchOverflowMessageShown(page, true);
  await verifySourceSearchSummary(page, "First 1000 results");

  // Verify search results for the string "test"
  await searchSources(page, "test");
  await verifySourceSearchOverflowMessageShown(page, false);
  await verifySourceSearchSummary(page, "12 results in 1 file");
  await verifyVisibleResultsCount(page, 16); // 12 results in 4 different files

  // Verify files can be collapsed
  await toggleSearchResultsForFileName(page, false, { fileName: "jsonp%20chunk%20loading" });
  await toggleSearchResultsForFileName(page, false, { fileName: "load%20script" });
  await verifyVisibleResultsCount(page, 13);

  // Verify files can be re-expanded
  await toggleSearchResultsForFileName(page, true, { fileName: "jsonp%20chunk%20loading" });
  await verifyVisibleResultsCount(page, 15);

  // Now include node_modules in the search
  await toggleExcludeNodeModulesCheckbox(page, false);
  await verifySourceSearchOverflowMessageShown(page, false);
  await verifySourceSearchSummary(page, "16 results in 1 file");
  await verifyVisibleResultsCount(page, 22); // 16 results in 6 different files

  // Collapse the first few results
  await toggleSearchResultsForFileName(page, false, { fileName: "unsupportedIterableToArray.js" });
  await toggleSearchResultsForFileName(page, false, { fileName: "jsonp%20chunk%20loading" });
  await toggleSearchResultsForFileName(page, false, { fileName: "load%20script" });
  await toggleSearchResultsForFileName(page, false, { fileName: "react-dom.production.min.js" });

  // Verify result 6 was not executed but result 7 was
  await verifyMatchExecuted(page, 6, false);
  await verifyMatchExecuted(page, 7, true);
});
