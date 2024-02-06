import { openDevToolsTab, startTest } from "../helpers";
import { warpToMessage } from "../helpers/console-panel";
import {
  openElementsPanel,
  searchElementsPanel,
  verifySearchResults,
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

  // This search string should not match anything initially
  await seekToTimePercent(page, 50);
  await searchElementsPanel(page, "inner-body");
  await verifySearchResults(page, { currentNumber: 0, totalNumber: 0 });

  // The search string should now match the <body> inside the <iframe>
  await warpToMessage(page, "iframeFinished");
  await openElementsPanel(page);
  await verifySearchResults(page, { currentNumber: 1, text: "<body", totalNumber: 1 });
});
