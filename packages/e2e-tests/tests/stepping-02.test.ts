import {
  test,
  openExample,
  clickDevTools,
  rewindToLine,
  stepInToLine,
  stepOverToLine,
  reverseStepOverToLine,
  stepOutToLine,
  clickSourceTreeNode,
  toggleBreakpoint,
  waitForScopeValue,
} from "../helpers";

test("Test basic step-over/back functionality.", async ({ screen }) => {
  await openExample(screen, "doc_rr_basic.html");
  await clickDevTools(screen);

  // Open doc_rr_basic.html
  await clickSourceTreeNode(screen, "test");
  await clickSourceTreeNode(screen, "examples");
  await clickSourceTreeNode(screen, "doc_rr_basic.html");

  await toggleBreakpoint(screen, 21);
  await rewindToLine(screen, { lineNumber: 21 });

  await stepInToLine(screen, 24);
  await stepOverToLine(screen, 25);
  await stepOverToLine(screen, 26);
  await reverseStepOverToLine(screen, 25);
  await stepInToLine(screen, 29);
  await stepOverToLine(screen, 30);
  await stepOverToLine(screen, 31);

  // Check that the scopes pane shows the value of the local variable.
  await waitForScopeValue(screen, "c", "NaN");
  await stepOverToLine(screen, 32);
  await reverseStepOverToLine(screen, 31);
  await stepOutToLine(screen, 26);
  await reverseStepOverToLine(screen, 25);
  await reverseStepOverToLine(screen, 24);
});
