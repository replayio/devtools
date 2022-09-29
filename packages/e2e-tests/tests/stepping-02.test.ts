import { openDevToolsTab, startTest, test } from "../helpers";
import {
  reverseStepOverToLine,
  rewindToLine,
  stepInToLine,
  stepOutToLine,
  stepOverToLine,
  waitForScopeValue,
} from "../helpers/pause-information-panel";
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

  await addBreakpoint(screen, { lineNumber: 21, url });
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
