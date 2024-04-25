import { openDevToolsTab, startTest } from "../helpers";
import {
  executeAndVerifyTerminalExpression,
  openConsolePanel,
  warpToMessage,
} from "../helpers/console-panel";
import {
  resumeToLine,
  reverseStepOverToLine,
  rewindToLine,
} from "../helpers/pause-information-panel";
import { addBreakpoint } from "../helpers/source-panel";
import test from "../testFixture";

test.use({ exampleKey: "doc_rr_error.html" });

test(`console_warp-01: should support warping to console messages`, async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);
  await openDevToolsTab(page);
  await openConsolePanel(page);

  await warpToMessage(page, "Number 5", 19);
  await executeAndVerifyTerminalExpression(page, "number", 5);

  await addBreakpoint(page, { lineNumber: 12, url: exampleKey });
  await rewindToLine(page, 12);
  await executeAndVerifyTerminalExpression(page, "number", 4);
  await resumeToLine(page, 12);
  await executeAndVerifyTerminalExpression(page, "number", 5);

  await warpToMessage(page, "Cannot set properties of undefined");
  await reverseStepOverToLine(page, 7);

  await warpToMessage(page, "superclass", 40);

  await reverseStepOverToLine(page, 40);
  await reverseStepOverToLine(page, 39);
});
