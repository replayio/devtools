import { openDevToolsTab, startTest } from "../helpers";
import { executeAndVerifyTerminalExpression } from "../helpers/console-panel";
import {
  reverseStepOverToLine,
  rewindToLine,
  stepOverToLine,
} from "../helpers/pause-information-panel";
import { clickSourceTreeNode } from "../helpers/source-explorer-panel";
import { addBreakpoint } from "../helpers/source-panel";
import test from "../testFixtureCloneRecording";

test.use({ exampleKey: "doc_rr_basic.html" });

test(`stepping-03: Stepping past the beginning or end of a frame should act like a step-out`, async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);

  // Open doc_rr_basic.html
  await clickSourceTreeNode(page, "test");
  await clickSourceTreeNode(page, "examples");
  await clickSourceTreeNode(page, exampleKey);

  await addBreakpoint(page, { lineNumber: 20, url: exampleKey });

  await rewindToLine(page, 20);
  await executeAndVerifyTerminalExpression(page, "number", "10");
  await reverseStepOverToLine(page, 19);
  await reverseStepOverToLine(page, 11);

  // After reverse-stepping out of the topmost frame we should rewind to the
  // last breakpoint hit.
  await reverseStepOverToLine(page, 20);
  await executeAndVerifyTerminalExpression(page, "number", "9");

  await stepOverToLine(page, 20); // TODO [FE-2109][RUN-2958] Chromium steps to the same line again
  await stepOverToLine(page, 21);
  await stepOverToLine(page, 21); // TODO [FE-2109][RUN-2958] Chromium steps to the same line again
  await stepOverToLine(page, 21); // TODO [FE-2109][RUN-2958] Gecko steps to empty line 22 but Chromium steps to line 21 yet again
  await stepOverToLine(page, 12);
  await stepOverToLine(page, 16);
  await stepOverToLine(page, 16); // TODO [FE-2109][RUN-2958] Chromium steps to the same line again
  await stepOverToLine(page, 17);

  // After forward-stepping out of the topmost frame we should run forward to
  // the next breakpoint hit.
  await stepOverToLine(page, 20);
  await executeAndVerifyTerminalExpression(page, "number", "10");
});
