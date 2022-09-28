import {
  test,
  checkEvaluateInTopFrame,
  openExample,
  rewind,
  rewindToLine,
  reverseStepOver,
  stepOver,
  clickSourceTreeNode,
  clickDevTools,
  toggleBreakpoint,
  togglePausePane,
  openPauseInformation,
} from "../helpers";

test("Test basic step-over/back functionality.", async ({ screen }) => {
  await openExample(screen, "doc_rr_basic.html");
  await clickDevTools(screen);

  // Open doc_rr_basic.html
  await clickSourceTreeNode(screen, "test");
  await clickSourceTreeNode(screen, "examples");
  await clickSourceTreeNode(screen, "doc_rr_basic.html");

  // Pause on line 20
  await toggleBreakpoint(screen, 20);
  await rewindToLine(screen);

  // Should get ten when evaluating number.
  await checkEvaluateInTopFrame(screen, "number", "10");

  // Should get nine when stepping over.
  await reverseStepOver(screen);
  await checkEvaluateInTopFrame(screen, "number", "9");

  // Should get ten when stepping over.
  await stepOver(screen);
  await checkEvaluateInTopFrame(screen, "number", "10");

  await new Promise(r => setTimeout(r, 1_000));
});
