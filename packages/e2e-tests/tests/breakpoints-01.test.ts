import test from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import { executeAndVerifyTerminalExpression } from "../helpers/console-panel";
import { resumeToLine, rewindToLine } from "../helpers/pause-information-panel";
import { addBreakpoint } from "../helpers/source-panel";

const url = "doc_rr_basic.html";

test(`breakpoints-01: Test basic breakpoint functionality`, async ({ page }) => {
  await startTest(page, url);
  await openDevToolsTab(page);

  await addBreakpoint(page, { lineNumber: 21, url });

  await rewindToLine(page, 21);
  await executeAndVerifyTerminalExpression(page, "number", "10");
  await rewindToLine(page, 21);
  await executeAndVerifyTerminalExpression(page, "number", "9");
  await rewindToLine(page, 21);
  await executeAndVerifyTerminalExpression(page, "number", "8");
  await rewindToLine(page, 21);
  await executeAndVerifyTerminalExpression(page, "number", "7");
  await rewindToLine(page, 21);
  await executeAndVerifyTerminalExpression(page, "number", "6");
  await resumeToLine(page, 21);
  await executeAndVerifyTerminalExpression(page, "number", "7");
  await resumeToLine(page, 21);
  await executeAndVerifyTerminalExpression(page, "number", "8");
  await resumeToLine(page, 21);
  await executeAndVerifyTerminalExpression(page, "number", "9");
  await resumeToLine(page, 21);
  await executeAndVerifyTerminalExpression(page, "number", "10");
});
