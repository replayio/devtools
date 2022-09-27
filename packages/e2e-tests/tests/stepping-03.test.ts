import {
  test,
  openExample,
  clickDevTools,
  rewindToLine,
  reverseStepOverToLine,
  stepOverToLine,
  clickSourceTreeNode,
  toggleBreakpoint,
  checkEvaluateInTopFrame,
} from "../helpers";

test(`Stepping past the beginning or end of a frame should act like a step-out.`, async ({
  screen,
}) => {
  await openExample(screen, "doc_rr_basic.html");
  await clickDevTools(screen);

  // Open doc_rr_basic.html
  await clickSourceTreeNode(screen, "test");
  await clickSourceTreeNode(screen, "examples");
  await clickSourceTreeNode(screen, "doc_rr_basic.html");

  await toggleBreakpoint(screen, 20);

  await rewindToLine(screen, 20);
  await checkEvaluateInTopFrame(screen, "number", "10");
  await reverseStepOverToLine(screen, 19);
  await reverseStepOverToLine(screen, 11);

  // After reverse-stepping out of the topmost frame we should rewind to the
  // last breakpoint hit.
  await reverseStepOverToLine(screen, 20);
  await checkEvaluateInTopFrame(screen, "number", "9");

  await stepOverToLine(screen, 21);
  await stepOverToLine(screen, 22);
  await stepOverToLine(screen, 12);
  await stepOverToLine(screen, 16);
  await stepOverToLine(screen, 17);

  // After forward-stepping out of the topmost frame we should run forward to
  // the next breakpoint hit.
  await stepOverToLine(screen, 20);
  await checkEvaluateInTopFrame(screen, "number", "10");
});
