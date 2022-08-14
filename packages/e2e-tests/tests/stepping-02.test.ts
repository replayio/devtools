import { test } from "@playwright/test";
import {
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

test("Test basic step-over/back functionality.", async ({ page }) => {
  await openExample(page, "doc_rr_basic.html");
  await clickDevTools(page);

  // Open doc_rr_basic.html
  await clickSourceTreeNode(page, "test");
  await clickSourceTreeNode(page, "examples");
  await clickSourceTreeNode(page, "doc_rr_basic.html");

  await toggleBreakpoint(page, 21);
  await rewindToLine(page, 21);

  await stepInToLine(page, 24);
  await stepOverToLine(page, 25);
  await stepOverToLine(page, 26);
  await reverseStepOverToLine(page, 25);
  await stepInToLine(page, 29);
  await stepOverToLine(page, 30);
  await stepOverToLine(page, 31);

  // Check that the scopes pane shows the value of the local variable.
  await waitForScopeValue(page, "c", "NaN");
  await stepOverToLine(page, 32);
  await reverseStepOverToLine(page, 31);
  await stepOutToLine(page, 26);
  await reverseStepOverToLine(page, 25);
  await reverseStepOverToLine(page, 24);
});
