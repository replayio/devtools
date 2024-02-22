import { openDevToolsTab, startTest } from "../helpers";
import {
  openPauseInformationPanel,
  rewindToLine,
  waitForPaused,
} from "../helpers/pause-information-panel";
import { clickSourceTreeNode } from "../helpers/source-explorer-panel";
import { addBreakpoint } from "../helpers/source-panel";
import test from "../testFixtureCloneRecording";

test.use({ exampleKey: "doc_rr_objects.html" });

test("stepping-07: Test quick stepping using the keyboard", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  const BrowserName = page.context().browser().browserType().name();

  await startTest(page, recordingId);
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
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press("F10");
  }
  // TODO: extra steps needed.
  if (BrowserName == "chromium") {
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("F10");
    }
  }

  // after all steps have been executed we should be paused on line 60
  await waitForPaused(page, 60);
});
