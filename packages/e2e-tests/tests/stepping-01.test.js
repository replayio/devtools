const { test } = require("@playwright/test");
const {
  checkEvaluateInTopFrame,
  openExample,
  rewind,
  reverseStepOver,
  stepOver,
  clickSourceTreeNode,
  clickDevTools,
  toggleBreakpoint,
  togglePausePane,
} = require("../helpers");

test("Test basic step-over/back functionality.", async ({ page }) => {
  await openExample(page, "doc_rr_basic.html");
  await clickDevTools(page);

  // Open doc_rr_basic.html
  await clickSourceTreeNode(page, "test");
  await clickSourceTreeNode(page, "examples");
  await clickSourceTreeNode(page, "doc_rr_basic.html");

  // Pause on line 20
  await toggleBreakpoint(page, 20);
  await togglePausePane(page);
  await rewind(page);

  // Should get ten when evaluating number.
  await checkEvaluateInTopFrame(page, "number", "10");

  // Should get nine when stepping over.
  await reverseStepOver(page);
  await checkEvaluateInTopFrame(page, "number", "9");

  // Should get ten when stepping over.
  await stepOver(page);
  await checkEvaluateInTopFrame(page, "number", "10");

  await new Promise(r => setTimeout(r, 1_000));
});
