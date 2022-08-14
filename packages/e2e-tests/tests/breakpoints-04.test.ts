import { test, Page } from "@playwright/test";

import {
  openExample,
  rewindToLine,
  addBreakpoint,
  clickDevTools,
  checkEvaluateInTopFrame,
  resumeToLine,
} from "../helpers";

// Test hitting breakpoints when using tricky control flow constructs:
test(`catch, finally, generators, and async/await.`, async ({ page }) => {
  await openExample(page, "doc_control_flow.html");
  await clickDevTools(page);

  await rewindToBreakpoint(page, 10);
  await resumeToBreakpoint(page, 12);
  await resumeToBreakpoint(page, 18);
  await resumeToBreakpoint(page, 20);
  await resumeToBreakpoint(page, 32);
  await resumeToBreakpoint(page, 27);
  await resumeToLine(page, 32);
  await resumeToLine(page, 27);
  await resumeToBreakpoint(page, 42);
  await resumeToBreakpoint(page, 44);
  await resumeToBreakpoint(page, 50);
  await resumeToBreakpoint(page, 54);
  await resumeToBreakpoint(page, 65);
  await resumeToBreakpoint(page, 72);

  async function rewindToBreakpoint(page: Page, line: number) {
    await addBreakpoint(page, "doc_control_flow.html", line);
    await rewindToLine(page, line);
  }

  async function resumeToBreakpoint(page: Page, line: number) {
    await addBreakpoint(page, "doc_control_flow.html", line);
    await resumeToLine(page, line);
  }
});
