import {
  test,
  openExample,
  rewindToLine,
  addBreakpoint,
  clickDevTools,
  checkEvaluateInTopFrame,
  resumeToLine,
} from "../helpers";

test(`Test basic breakpoint functionality.`, async ({ screen }) => {
  await openExample(screen, "doc_rr_basic.html");
  await clickDevTools(screen);

  await addBreakpoint(screen, { lineNumber: 21, url: "doc_rr_basic.html" });

  await rewindToLine(screen, {
    lineNumber: 21,
  });
  await checkEvaluateInTopFrame(screen, "number", "10");
  await rewindToLine(screen, { lineNumber: 21 });
  await checkEvaluateInTopFrame(screen, "number", "9");
  await rewindToLine(screen, { lineNumber: 21 });
  await checkEvaluateInTopFrame(screen, "number", "8");
  await rewindToLine(screen, { lineNumber: 21 });
  await checkEvaluateInTopFrame(screen, "number", "7");
  await rewindToLine(screen, { lineNumber: 21 });
  await checkEvaluateInTopFrame(screen, "number", "6");
  await resumeToLine(screen, { lineNumber: 21 });
  await checkEvaluateInTopFrame(screen, "number", "7");
  await resumeToLine(screen, { lineNumber: 21 });
  await checkEvaluateInTopFrame(screen, "number", "8");
  await resumeToLine(screen, { lineNumber: 21 });
  await checkEvaluateInTopFrame(screen, "number", "9");
  await resumeToLine(screen, { lineNumber: 21 });
  await checkEvaluateInTopFrame(screen, "number", "10");
});
