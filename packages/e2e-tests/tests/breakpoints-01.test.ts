import { test } from "@playwright/test";

import {
  openExample,
  rewindToLine,
  addBreakpoint,
  clickDevTools,
  checkEvaluateInTopFrame,
  resumeToLine,
} from "../helpers";

test(`Test basic breakpoint functionality.`, async ({ page }) => {
  await openExample(page, "doc_rr_basic.html");
  await clickDevTools(page);

  await addBreakpoint(page, "doc_rr_basic.html", 21);

  await rewindToLine(page, 21);
  await checkEvaluateInTopFrame(page, "number", "10");
  await rewindToLine(page, 21);
  await checkEvaluateInTopFrame(page, "number", "9");
  await rewindToLine(page, 21);
  await checkEvaluateInTopFrame(page, "number", "8");
  await rewindToLine(page, 21);
  await checkEvaluateInTopFrame(page, "number", "7");
  await rewindToLine(page, 21);
  await checkEvaluateInTopFrame(page, "number", "6");
  await resumeToLine(page, 21);
  await checkEvaluateInTopFrame(page, "number", "7");
  await resumeToLine(page, 21);
  await checkEvaluateInTopFrame(page, "number", "8");
  await resumeToLine(page, 21);
  await checkEvaluateInTopFrame(page, "number", "9");
  await resumeToLine(page, 21);
  await checkEvaluateInTopFrame(page, "number", "10");
});
