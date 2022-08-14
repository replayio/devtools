import { test } from "@playwright/test";

import {
  openExample,
  rewindToLine,
  addBreakpoint,
  clickDevTools,
  checkEvaluateInTopFrame,
  resumeToLine,
} from "../helpers";

// Test hitting breakpoints when rewinding past the point where the breakpoint
test(`script was created.`, async ({ page }) => {
  await openExample(page, "doc_rr_basic.html");
  await clickDevTools(page);

  await rewindToLine(page);

  await addBreakpoint(page, "doc_rr_basic.html", 21);
  await resumeToLine(page, 21);
  await checkEvaluateInTopFrame(page, "number", "1");
  await resumeToLine(page, 21);
  await checkEvaluateInTopFrame(page, "number", "2");
});
