import { openDevToolsTab, startTest, test } from "../helpers";
import { executeAndVerifyTerminalExpression } from "../helpers/console-panel";
import { reverseStepOver, rewindToLine, stepOver } from "../helpers/pause-information-panel";
import { clickSourceTreeNode } from "../helpers/source-explorer-panel";
import { addBreakpoint } from "../helpers/source-panel";

const url = "doc_rr_basic.html";

test("Test basic step-over/back functionality.", async ({ screen }) => {
  await startTest(screen, url);
  await openDevToolsTab(screen);

  // Open doc_rr_basic.html
  await clickSourceTreeNode(screen, "test");
  await clickSourceTreeNode(screen, "examples");
  await clickSourceTreeNode(screen, url);

  // Pause on line 20
  await addBreakpoint(screen, { lineNumber: 20, url });
  await rewindToLine(screen);

  // Should get ten when evaluating number.
  await executeAndVerifyTerminalExpression(screen, "number", "10");

  // Should get nine when stepping over.
  await reverseStepOver(screen);
  await executeAndVerifyTerminalExpression(screen, "number", "9");

  // Should get ten when stepping over.
  await stepOver(screen);
  await executeAndVerifyTerminalExpression(screen, "number", "10");
});
