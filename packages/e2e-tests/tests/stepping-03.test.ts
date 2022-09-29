import { openDevToolsTab, startTest, test } from "../helpers";
import { executeAndVerifyTerminalExpression } from "../helpers/console-panel";
import {
  reverseStepOverToLine,
  rewindToLine,
  stepOverToLine,
} from "../helpers/pause-information-panel";
import { clickSourceTreeNode } from "../helpers/source-explorer-panel";
import { addBreakpoint } from "../helpers/source-panel";

const url = "doc_rr_basic.html";

test(`Stepping past the beginning or end of a frame should act like a step-out.`, async ({
  screen,
}) => {
  await startTest(screen, url);
  await openDevToolsTab(screen);

  // Open doc_rr_basic.html
  await clickSourceTreeNode(screen, "test");
  await clickSourceTreeNode(screen, "examples");
  await clickSourceTreeNode(screen, url);

  await addBreakpoint(screen, { lineNumber: 20, url });

  await rewindToLine(screen, { lineNumber: 20 });
  await executeAndVerifyTerminalExpression(screen, "number", "10");
  await reverseStepOverToLine(screen, 19);
  await reverseStepOverToLine(screen, 11);

  // After reverse-stepping out of the topmost frame we should rewind to the
  // last breakpoint hit.
  await reverseStepOverToLine(screen, 20);
  await executeAndVerifyTerminalExpression(screen, "number", "9");

  await stepOverToLine(screen, 21);
  await stepOverToLine(screen, 22);
  await stepOverToLine(screen, 12);
  await stepOverToLine(screen, 16);
  await stepOverToLine(screen, 17);

  // After forward-stepping out of the topmost frame we should run forward to
  // the next breakpoint hit.
  await stepOverToLine(screen, 20);
  await executeAndVerifyTerminalExpression(screen, "number", "10");
});
