import { test, Page } from "@playwright/test";

import {
  openExample,
  clickDevTools,
  removeAllBreakpoints,
  rewindToLine,
  addBreakpoint,
  resumeToLine,
} from "../helpers";

test(`Test interaction of breakpoints with debugger statements.`, async ({ page }) => {
  await openExample(page, "doc_debugger_statements.html");
  await clickDevTools(page);

  // TODO: remove timeout
  await new Promise(r => setTimeout(r, 1000));
  await rewindToLine(page, 9);
  await addBreakpoint(page, "doc_debugger_statements.html", 8);
  await rewindToLine(page, 8);
  await resumeToLine(page, 9);
  await removeAllBreakpoints(page);
  await rewindToLine(page, 7);
  await resumeToLine(page, 9);
});
