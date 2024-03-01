import { openDevToolsTab, startTest } from "../helpers";
import {
  executeAndVerifyTerminalExpression,
  openConsolePanel,
  toggleConsoleMessageType,
  verifyPausedAtMessage,
  warpToMessage,
} from "../helpers/console-panel";
import { reverseStepOverToLine, stepOverToLine } from "../helpers/pause-information-panel";
import test from "../testFixtureCloneRecording";

test.use({ exampleKey: "doc_rr_logs.html" });

test("console_warp-02: support pausing, warping, stepping and evaluating console messages", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);
  await openConsolePanel(page);

  // When warping to a message, it is the paused one.
  await warpToMessage(page, "number: 2");
  await verifyPausedAtMessage(page, "number: 2", "console-log");

  await stepOverToLine(page, 20);
  await verifyPausedAtMessage(page, "number: 3", "console-log");

  // When stepping back we end up earlier than the console call, even though we're paused at the same line.
  // This isn't ideal.
  await reverseStepOverToLine(page, 19);
  await verifyPausedAtMessage(page, "number: 2", "console-log");

  await warpToMessage(page, "number: 2");
  await verifyPausedAtMessage(page, "number: 2", "console-log");

  await stepOverToLine(page, 20);
  await verifyPausedAtMessage(page, "number: 3", "console-log");

  await executeAndVerifyTerminalExpression(page, "1 << 5", 32, false);
  await verifyPausedAtMessage(page, "1 << 5", "terminal-expression");

  await stepOverToLine(page, 21);
  await verifyPausedAtMessage(page, "number: 3", "console-log");

  await executeAndVerifyTerminalExpression(page, "1 << 7", 128, false);
  await verifyPausedAtMessage(page, "1 << 7", "terminal-expression");

  await reverseStepOverToLine(page, 20);
  await verifyPausedAtMessage(page, "1 << 5", "terminal-expression");

  await executeAndVerifyTerminalExpression(page, "1 << 6", 64, false);

  await stepOverToLine(page, 21);
  await verifyPausedAtMessage(page, "1 << 7", "terminal-expression");

  // TODO [RUN-3271] Chromium currently requires an extra step here
  await stepOverToLine(page, 21);
  await stepOverToLine(page, 22);
  await verifyPausedAtMessage(page, "ExampleFinished", "console-log");
});
