import { openDevToolsTab, startTest } from "../helpers";
import {
  addEventListenerLogpoints,
  openConsolePanel,
  warpToMessage,
} from "../helpers/console-panel";
import {
  resumeToLine,
  rewindToLine,
  stepInToLine,
  stepOutToLine,
  stepOverToLine,
} from "../helpers/pause-information-panel";
import { addBreakpoint } from "../helpers/source-panel";
import test from "../testFixtureCloneRecording";

test.use({ exampleKey: "doc_minified.html" });

test(`stepping-05: Test stepping in pretty-printed code`, async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  page.setDefaultTimeout(120000);
  await startTest(page, recordingId);
  await openDevToolsTab(page);

  await addBreakpoint(page, { url: "bundle_input.js", lineNumber: 4 });
  await rewindToLine(page, 4);
  await stepInToLine(page, 2);

  // Add a breakpoint in minified.html and resume to there
  await addBreakpoint(page, { url: exampleKey, lineNumber: 8 });
  await resumeToLine(page, 8);
  await stepOverToLine(page, 9);
  await stepOverToLine(page, 10);

  await openConsolePanel(page);
  await addEventListenerLogpoints(page, [{ eventType: "event.mouse.click", categoryKey: "mouse" }]);
  await warpToMessage(page, "(click)", 15);

  await stepInToLine(page, 2);
  await stepOutToLine(page, 15);
  await stepInToLine(page, 11);
  await stepOutToLine(page, 15);
  await stepInToLine(page, 6);
  await stepOutToLine(page, 16);
});
