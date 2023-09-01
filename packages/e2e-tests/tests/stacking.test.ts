import { openDevToolsTab, startTest } from "../helpers";
import { openConsolePanel, warpToMessage } from "../helpers/console-panel";
import { toggleToolboxLayout } from "../helpers/layout";
import { ensureSidePanelClosed } from "../helpers/pause-information-panel";
import {
  stackingTestCases,
  verifyStackingTestCaseSelectedElementUnderCursor,
} from "../helpers/stacking-test-cases";
import { debugPrint } from "../helpers/utils";
import test from "../testFixtureCloneRecording";

test.use({ exampleKey: "doc_stacking.html" });

test("stacking: Element highlighter selects the correct element when they overlap", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, exampleKey, recordingId);
  await openDevToolsTab(page);

  await warpToMessage(page, "ExampleFinished");

  // Ensure that the left sidebar is collapsed
  await ensureSidePanelClosed(page);

  await openConsolePanel(page);

  // Dock the console to the _left_ side, to make the video preview as big as possible
  await toggleToolboxLayout(page, "left");

  const canvas = page.locator("canvas#graphics");
  const rulesContainer = page.locator("#ruleview-container");

  for (let testCase of stackingTestCases) {
    // Really make sure the panel is closed
    // ensureSidePanelClosed(page);
    debugPrint(page, `Stacking test case: ${testCase.id}`);
    await verifyStackingTestCaseSelectedElementUnderCursor(page, canvas, rulesContainer, testCase);
  }
});
