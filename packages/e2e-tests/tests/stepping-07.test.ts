import { openDevToolsTab, startTest } from "../helpers";
import {
  openPauseInformationPanel,
  rewindToLine,
  waitForPaused,
} from "../helpers/pause-information-panel";
import { clickSourceTreeNode } from "../helpers/source-explorer-panel";
import { addBreakpoint } from "../helpers/source-panel";
import test from "../testFixture";

test.use({ exampleKey: "doc_rr_objects.html" });

test("stepping-07: Test quick stepping using the keyboard", async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);
  await openDevToolsTab(page);

  // Open doc_rr_objects.html
  await clickSourceTreeNode(page, "test");
  await clickSourceTreeNode(page, "examples");
  await clickSourceTreeNode(page, exampleKey);

  await openPauseInformationPanel(page);

  // Pause on line 50
  await addBreakpoint(page, { lineNumber: 50, url: exampleKey });
  await rewindToLine(page, 50);

  // "Step over" ten times *without* waiting for each step to complete
  // TODO [RUN-3271] Chromium currently requires 2 steps per line,
  // so we're stepping 20 times here until RUN-3271 is fixed
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press("F10");
  }

  // after all steps have been executed we should be paused on line 60
  await waitForPaused(page, 60);
});
