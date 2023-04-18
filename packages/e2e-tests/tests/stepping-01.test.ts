import test from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import { executeAndVerifyTerminalExpression } from "../helpers/console-panel";
import { reverseStepOver, rewind, stepOver } from "../helpers/pause-information-panel";
import { clickSourceTreeNode } from "../helpers/source-explorer-panel";
import { addBreakpoint } from "../helpers/source-panel";

const url = "doc_rr_basic.html";

test("stepping-01: Test basic step-over/back functionality", async ({ page }) => {
  await startTest(page, url);
  await openDevToolsTab(page);

  // Open doc_rr_basic.html
  await clickSourceTreeNode(page, "test");
  await clickSourceTreeNode(page, "examples");
  await clickSourceTreeNode(page, url);

  // Pause on line 20
  await addBreakpoint(page, { lineNumber: 20, url });
  await rewind(page);

  // Should get ten when evaluating number.
  await executeAndVerifyTerminalExpression(page, "number", "10");

  // Should get nine when stepping over.
  await reverseStepOver(page);
  await executeAndVerifyTerminalExpression(page, "number", "9");

  // Should get ten when stepping over.
  await stepOver(page);
  await executeAndVerifyTerminalExpression(page, "number", "10");
});
