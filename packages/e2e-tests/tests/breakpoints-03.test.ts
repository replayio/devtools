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

  await addBreakpoint(screen, { lineNumber: 8, url: "doc_rr_basic.html" });
  // Rewind to when the point was hit
  await rewindToLine(screen, { lineNumber: 8 });
  // Rewind further (past the first hit)
  await rewindToLine(screen);

  await removeBreakpoint(screen, { lineNumber: 8, url: "doc_rr_basic.html" });

  await addBreakpoint(screen, { lineNumber: 21, url: "doc_rr_basic.html" });
  await resumeToLine(screen, { lineNumber: 21 });
  await checkEvaluateInTopFrame(screen, "number", "1");
  await resumeToLine(screen, { lineNumber: 21 });
  await checkEvaluateInTopFrame(screen, "number", "2");
});
