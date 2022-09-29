import { openDevToolsTab, startTest, test } from "../helpers";
import {
  openPauseInformationPanel,
  resumeToLine,
  rewindToLine,
} from "../helpers/pause-information-panel";
import { addBreakpoint, removeBreakpoint } from "../helpers/source-panel";

const url = "doc_debugger_statements.html";

test(`Test interaction of breakpoints with debugger statements.`, async ({ screen }) => {
  await startTest(screen, url);
  await openDevToolsTab(screen);
  await openPauseInformationPanel(screen);

  // Without any breakpoints, this test should rewind to the closest debugger statement.
  await rewindToLine(screen, { lineNumber: 9 });

  // Without a breakpoints being the next nearest thing, we should rewind to it.
  await addBreakpoint(screen, {
    lineNumber: 8,
    url,
  });
  await rewindToLine(screen, { lineNumber: 8 });
  await resumeToLine(screen, { lineNumber: 9 });

  // Without any breakpoints (again), we should rewind to debugger statements.
  await removeBreakpoint(screen, {
    lineNumber: 8,
    url,
  });
  await rewindToLine(screen, { lineNumber: 7 });
  await resumeToLine(screen, { lineNumber: 9 });
});
