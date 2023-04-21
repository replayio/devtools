import test from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import { executeAndVerifyTerminalExpression } from "../helpers/console-panel";
import { resumeToLine, rewind, rewindToLine } from "../helpers/pause-information-panel";
import { addBreakpoint, removeBreakpoint } from "../helpers/source-panel";

const url = "doc_rr_basic.html";

test(`breakpoints-03: Test stepping forward through breakpoints when rewound before the first one`, async ({
  page,
}) => {
  await startTest(page, url);
  await openDevToolsTab(page);

  await addBreakpoint(page, { lineNumber: 9, url });
  // Rewind to when the point was hit
  await rewindToLine(page, 9);
  // Rewind further (past the first hit)
  await rewind(page);

  await removeBreakpoint(page, { lineNumber: 9, url });

  await addBreakpoint(page, { lineNumber: 21, url });
  await resumeToLine(page, 21);
  await executeAndVerifyTerminalExpression(page, "number", "1");
  await resumeToLine(page, 21);
  await executeAndVerifyTerminalExpression(page, "number", "2");
});
