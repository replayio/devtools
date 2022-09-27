import {
  addBreakpoint,
  checkEvaluateInTopFrame,
  clickDevTools,
  openExample,
  removeBreakpoint,
  resumeToLine,
  rewindToLine,
  test,
} from "../helpers";

test(`Test stepping forward through breakpoints when rewound before the first one.`, async ({
  screen,
}) => {
  await openExample(screen, "doc_rr_basic.html");
  await clickDevTools(screen);

  await addBreakpoint(screen, "doc_rr_basic.html", 8);
  // Rewind to when the point was hit
  await rewindToLine(screen, {lineNumber: 8});
  // Rewind further (past the first hit)
  await rewindToLine(screen);

  await removeBreakpoint(screen, "doc_rr_basic.html", 8);

  await addBreakpoint(screen, "doc_rr_basic.html", 21);
  await resumeToLine(screen, {lineNumber: 21});
  await checkEvaluateInTopFrame(screen, "number", "1");
  await resumeToLine(screen, {lineNumber: 21});
  await checkEvaluateInTopFrame(screen, "number", "2");
});
