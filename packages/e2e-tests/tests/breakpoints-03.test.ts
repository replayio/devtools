import {
  test,
  openExample,
  rewindToLine,
  addBreakpoint,
  clickDevTools,
  checkEvaluateInTopFrame,
  resumeToLine,
} from "../helpers";

// Test hitting breakpoints when rewinding past the point where the breakpoint
test(`Test hitting breakpoints when rewinding past the point where the breakpoint.`, async ({
  screen,
}) => {
  await openExample(screen, "doc_rr_basic.html");
  await clickDevTools(screen);

  await rewindToLine(screen);

  await addBreakpoint(screen, "doc_rr_basic.html", 21);
  await resumeToLine(screen, 21);
  await checkEvaluateInTopFrame(screen, "number", "1");
  await resumeToLine(screen, 21);
  await checkEvaluateInTopFrame(screen, "number", "2");
});
