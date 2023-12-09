import { openDevToolsTab, startTest } from "../helpers";
import { warpToMessage } from "../helpers/console-panel";
import {
  openElementsPanel,
  searchElementsPanel,
  verifySearchResults,
  waitForElementsToLoad,
} from "../helpers/elements-panel";
import { seekToTimePercent } from "../helpers/timeline";
import test from "../testFixtureCloneRecording";

test.use({ exampleKey: "doc_inspector_basic.html" });

test(`inspector-elements-05_search: element picker and iframe behavior`, async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);
  await openElementsPanel(page);
  await waitForElementsToLoad(page);

  // This search string should not match anything initially
  await seekToTimePercent(page, 5);
  await searchElementsPanel(page, "myiframe");
  await verifySearchResults(page, { currentNumber: 0, totalNumber: 0 });

  // The search string should now match an <iframe> and text inside of the <script> tag within the <iframe>
  await seekToTimePercent(page, 90);
  await verifySearchResults(page, { currentNumber: 1, text: "<iframe", totalNumber: 2 });
});
