import { openDevToolsTab, startTest } from "../helpers";
import { executeAndVerifyTerminalExpression } from "../helpers/console-panel";
import { rewindToLine } from "../helpers/pause-information-panel";
import { addBreakpoint } from "../helpers/source-panel";
import test from "../testFixture";

test.use({ exampleKey: "doc_rr_basic.html" });

test(`breakpoints-02: Test unhandled divergence while evaluating at a breakpoint`, async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);
  await openDevToolsTab(page);

  await addBreakpoint(page, { lineNumber: 21, url: exampleKey });

  await rewindToLine(page, 21);

  await executeAndVerifyTerminalExpression(page, "number", "10");
  await executeAndVerifyTerminalExpression(page, "stop()", `undefined`);
  await executeAndVerifyTerminalExpression(page, "number", "10");
  await executeAndVerifyTerminalExpression(page, "stop()", `undefined`);
  await executeAndVerifyTerminalExpression(page, "number", "10");
  await executeAndVerifyTerminalExpression(page, "testStepping2()", "undefined");
});
