import test from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import { executeAndVerifyTerminalExpression } from "../helpers/console-panel";
import { rewindToLine } from "../helpers/pause-information-panel";
import { addBreakpoint } from "../helpers/source-panel";

const url = "doc_rr_basic.html";

test(`breakpoints-02: Test unhandled divergence while evaluating at a breakpoint`, async ({
  page,
}) => {
  await startTest(page, url);
  await openDevToolsTab(page);

  await addBreakpoint(page, { lineNumber: 21, url });

  await rewindToLine(page, 21);

  await executeAndVerifyTerminalExpression(page, "number", "10");
  await executeAndVerifyTerminalExpression(
    page,
    "dump(3)",
    `The expression could not be evaluated.`
  );
  await executeAndVerifyTerminalExpression(page, "number", "10");
  await executeAndVerifyTerminalExpression(
    page,
    "dump(3)",
    `The expression could not be evaluated.`
  );
  await executeAndVerifyTerminalExpression(page, "number", "10");
  await executeAndVerifyTerminalExpression(page, "testStepping2()", "undefined");
});
