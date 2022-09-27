import {
  test,
  openExample,
  rewindToLine,
  addBreakpoint,
  clickDevTools,
  checkEvaluateInTopFrame,
  resumeToLine,
} from "../helpers";
test(`Test unhandled divergence while evaluating at a breakpoint.`, async ({ screen }) => {
  await openExample(screen, "doc_rr_basic.html");
  await clickDevTools(screen);

  await addBreakpoint(screen, "doc_rr_basic.html", 21);
  await rewindToLine(screen, 21);

  await checkEvaluateInTopFrame(screen, "number", "10");
  await checkEvaluateInTopFrame(screen, "dump(3)", `Error: Evaluation failed`);
  await checkEvaluateInTopFrame(screen, "number", "10");
  await checkEvaluateInTopFrame(screen, "dump(3)", `Error: Evaluation failed`);
  await checkEvaluateInTopFrame(screen, "number", "10");
  await checkEvaluateInTopFrame(screen, "testStepping2()", "undefined");
});
