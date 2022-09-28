import {
  addBreakpoint,
  clickDevTools,
  openExample,
  openPauseInformation,
  removeBreakpoint,
  resumeToLine,
  rewindToLine,
  test,
} from "../helpers";

test(`Test interaction of breakpoints with debugger statements.`, async ({ screen }) => {
  await openExample(screen, "doc_debugger_statements.html");
  await clickDevTools(screen);
  await openPauseInformation(screen);

  // Without any breakpoints, this test should rewind to the closest debugger statement.
  await rewindToLine(screen, { lineNumber: 9 });

  // Without a breakpoints being the next nearest thing, we should rewind to it.
  await addBreakpoint(screen, {
    lineNumber: 8,
    url: "doc_debugger_statements.html",
  });
  await rewindToLine(screen, { lineNumber: 8 });
  await resumeToLine(screen, { lineNumber: 9 });

  // Without any breakpoints (again), we should rewind to debugger statements.
  await removeBreakpoint(screen, {
    lineNumber: 8,
    url: "doc_debugger_statements.html",
  });
  await rewindToLine(screen, { lineNumber: 7 });
  await resumeToLine(screen, { lineNumber: 9 });
});
