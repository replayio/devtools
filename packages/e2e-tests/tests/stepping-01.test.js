const { test } = require("@playwright/test");
const {
  evaluateInConsole,
  openExample,
  waitForConsoleMessage,
  resume,
  reverseStepOver,
  stepOver,
  clickSourceTreeNode,
  clearConsoleEvaluations,
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
  await resume(page);

  // Should get ten when evaluating number.
  await evaluateInConsole(page, "number");
  await waitForConsoleMessage(page, "10");
  await clearConsoleEvaluations(page);

  // Should get nine when stepping over.
  await reverseStepOver(page);
  await evaluateInConsole(page, "number");
  await waitForConsoleMessage(page, "9");
  await clearConsoleEvaluations(page);

  // Should get ten when stepping over.
  await stepOver(page);
  await evaluateInConsole(page, "number");
  await waitForConsoleMessage(page, "10");
  await clearConsoleEvaluations(page);

  await new Promise(r => setTimeout(r, 1_000));
});
