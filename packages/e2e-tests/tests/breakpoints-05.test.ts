import {
  test,
  openExample,
  clickDevTools,
  removeAllBreakpoints,
  rewindToLine,
  addBreakpoint,
  resumeToLine,
} from "../helpers";

test(`Test interaction of breakpoints with debugger statements.`, async ({ screen }) => {
  await openExample(screen, "doc_debugger_statements.html");
  await clickDevTools(screen);

  // TODO: remove timeout
  await new Promise(r => setTimeout(r, 1000));
  await rewindToLine(screen, 9);
  await addBreakpoint(screen, "doc_debugger_statements.html", 8);
  await rewindToLine(screen, 8);
  await resumeToLine(screen, 9);
  await removeAllBreakpoints(screen);
  await rewindToLine(screen, 7);
  await resumeToLine(screen, 9);
});
