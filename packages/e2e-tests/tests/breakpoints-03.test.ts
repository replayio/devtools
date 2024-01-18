import { openDevToolsTab, startTest } from "../helpers";
import { executeAndVerifyTerminalExpression } from "../helpers/console-panel";
import { resumeToLine, rewind, rewindToLine } from "../helpers/pause-information-panel";
import { addBreakpoint, removeBreakpoint } from "../helpers/source-panel";
import test from "../testFixtureCloneRecording";

test.use({ exampleKey: "doc_rr_basic_chromium.html" });

test(`breakpoints-03: Test stepping forward through breakpoints when rewound before the first one`, async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);

  await addBreakpoint(page, { lineNumber: 9, url: exampleKey });
  // Rewind to when the point was hit
  await rewindToLine(page, 9);
  // Rewind further (past the first hit)
  await rewind(page);

  await removeBreakpoint(page, { lineNumber: 9, url: exampleKey });

  await addBreakpoint(page, { lineNumber: 21, url: exampleKey });
  await resumeToLine(page, 21);
  await executeAndVerifyTerminalExpression(page, "number", "1");
  await resumeToLine(page, 21);
  await executeAndVerifyTerminalExpression(page, "number", "2");
});
