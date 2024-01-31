import { openDevToolsTab, startTest } from "../helpers";
import { warpToMessage } from "../helpers/console-panel";
import {
  openElementsPanel,
  runOrAdvanceSearch,
  searchElementsPanel,
  toggleAdvanced,
  verifySearchResults,
  verifySelectedElement,
  waitForElementsToLoad,
} from "../helpers/elements-panel";
import { seekToTimePercent } from "../helpers/timeline";
import test from "../testFixtureCloneRecording";

test.use({ exampleKey: "doc_stacking_chromium.html" });

test("elements-search: Element panel should support basic and advanced search modes", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);
  await warpToMessage(page, "ExampleFinished");
  await openElementsPanel(page);
  await waitForElementsToLoad(page);

  // Run basic search
  await searchElementsPanel(page, '<div style="left: 100px', false);
  await verifySearchResults(page, {
    currentNumber: 1,
    totalNumber: 4,
  });
  await verifySelectedElement(page, '<div style="left: 100px');

  // Advance search
  await runOrAdvanceSearch(page);
  await verifySearchResults(page, {
    currentNumber: 2,
    totalNumber: 4,
  });

  // Toggle advanced and verify search results updated
  await toggleAdvanced(page, true);
  await runOrAdvanceSearch(page);
  await verifySearchResults(page, {
    currentNumber: 0,
    totalNumber: 0,
  });

  // Run advance search
  await searchElementsPanel(page, '[class="box1"]');
  await verifySearchResults(page, {
    currentNumber: 1,
    totalNumber: 16,
  });
  await verifySelectedElement(page, '<div class="box1" />');

  // Advance search
  await runOrAdvanceSearch(page);
  await verifySearchResults(page, {
    currentNumber: 2,
    totalNumber: 16,
  });

  // Toggle basic and verify search results updated
  await toggleAdvanced(page, false);
  await runOrAdvanceSearch(page);
  await verifySearchResults(page, {
    currentNumber: 0,
    totalNumber: 0,
  });

  // Re-run basic search
  await searchElementsPanel(page, "</body>");
  await verifySearchResults(page, {
    currentNumber: 1,
    totalNumber: 1,
  });
  await verifySelectedElement(page, "</body>");

  // Change timeline and verify results are updated
  await seekToTimePercent(page, 0);
  await verifySearchResults(page, {
    currentNumber: 0,
    totalNumber: 0,
  });
});
