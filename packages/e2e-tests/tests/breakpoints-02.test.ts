import { test } from "@playwright/test";

import {
  openExample,
  rewindToLine,
  addBreakpoint,
  clickDevTools,
  checkEvaluateInTopFrame,
  resumeToLine,
} from "../helpers";
test(`Test unhandled divergence while evaluating at a breakpoint.`, async ({ page }) => {
  await openExample(page, "doc_rr_basic.html");
  await clickDevTools(page);

  await addBreakpoint(page, "doc_rr_basic.html", 21);
  await rewindToLine(page, 21);

  await checkEvaluateInTopFrame(page, "number", "10");
  await checkEvaluateInTopFrame(page, "dump(3)", `Error: Evaluation failed`);
  await checkEvaluateInTopFrame(page, "number", "10");
  await checkEvaluateInTopFrame(page, "dump(3)", `Error: Evaluation failed`);
  await checkEvaluateInTopFrame(page, "number", "10");
  await checkEvaluateInTopFrame(page, "testStepping2()", "undefined");
});
