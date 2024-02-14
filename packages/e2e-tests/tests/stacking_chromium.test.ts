import { openDevToolsTab, startTest } from "../helpers";
import { openConsolePanel, warpToMessage } from "../helpers/console-panel";
import { toggleToolboxLayout } from "../helpers/layout";
import { closeSidePanel } from "../helpers/pause-information-panel";
import {
  stackingTestCases,
  verifyStackingTestCaseSelectedElementUnderCursor,
} from "../helpers/stacking-test-cases";
import test from "../testFixtureCloneRecording";

test.use({ exampleKey: "doc_stacking_chromium.html" });

test.skip("stacking: Element highlighter selects the correct element when they overlap", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);

  await warpToMessage(page, "ExampleFinished");

  // Ensure that the left sidebar is collapsed
  await closeSidePanel(page);

  await openConsolePanel(page);

  // Dock the console to the _left_ side, to make the video preview as big as possible
  await toggleToolboxLayout(page, "left");

  const element = page.locator("#graphics");
  const rulesContainer = page.locator('[data-test-id="RulesPanel"]');

  for (let testCase of stackingTestCases) {
    // Really make sure the panel is closed
    closeSidePanel(page);
    await verifyStackingTestCaseSelectedElementUnderCursor(page, element, rulesContainer, testCase);
  }
});
