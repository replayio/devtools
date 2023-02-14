import test from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import {
  openPauseInformationPanel,
  resumeToLine,
  rewindToLine,
} from "../helpers/pause-information-panel";
import { addBreakpoint, removeBreakpoint } from "../helpers/source-panel";
import { delay } from "../helpers/utils";

const url = "doc_debugger_statements.html";

test(`breakpoints-05: Test interaction of breakpoints with debugger statements`, async ({
  page,
}) => {
  await startTest(page, url);
  await openDevToolsTab(page);
  await openPauseInformationPanel(page);
  await delay(1000);

  // Without any breakpoints, this test should rewind to the closest debugger statement.
  await rewindToLine(page, { lineNumber: 9 });

  // Without a breakpoints being the next nearest thing, we should rewind to it.
  await addBreakpoint(page, {
    lineNumber: 8,
    url,
  });
  await rewindToLine(page, { lineNumber: 8 });
  await resumeToLine(page, { lineNumber: 9 });

  // Without any breakpoints (again), we should rewind to debugger statements.
  await removeBreakpoint(page, {
    lineNumber: 8,
    url,
  });

  await rewindToLine(page, { lineNumber: 7 });
  await resumeToLine(page, { lineNumber: 9 });
});
