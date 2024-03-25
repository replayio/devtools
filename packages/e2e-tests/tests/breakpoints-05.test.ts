import { openDevToolsTab, startTest } from "../helpers";
import {
  openPauseInformationPanel,
  resumeToLine,
  rewindToLine,
} from "../helpers/pause-information-panel";
import { addBreakpoint, removeBreakpoint } from "../helpers/source-panel";
import test from "../testFixture";

test.use({ exampleKey: "doc_debugger_statements.html" });

test(`breakpoints-05: Test interaction of breakpoints with debugger statements`, async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);
  await openPauseInformationPanel(page);
  // wait for the recording to be fully loaded
  await page.locator('[data-test-id="FocusInputs"]').waitFor();

  // Without any breakpoints, this test should rewind to the closest debugger statement.
  await rewindToLine(page, 9);

  // Without a breakpoints being the next nearest thing, we should rewind to it.
  await addBreakpoint(page, {
    lineNumber: 8,
    url: exampleKey,
  });
  await rewindToLine(page, 8);
  await resumeToLine(page, 9);

  // Without any breakpoints (again), we should rewind to debugger statements.
  await removeBreakpoint(page, {
    lineNumber: 8,
    url: exampleKey,
  });

  await rewindToLine(page, 7);
  await resumeToLine(page, 9);
});
