import { openDevToolsTab, startTest, test } from "../helpers";
import { executeAndVerifyTerminalExpression } from "../helpers/console-panel";
import { rewindToLine } from "../helpers/pause-information-panel";
import { addBreakpoint } from "../helpers/source-panel";

const url = "doc_rr_basic.html";

test(`Test unhandled divergence while evaluating at a breakpoint.`, async ({ screen }) => {
  await startTest(screen, url);
  await openDevToolsTab(screen);

  await addBreakpoint(screen, { lineNumber: 21, url });

  await rewindToLine(screen, { lineNumber: 21 });

  await executeAndVerifyTerminalExpression(screen, "number", "10");
  await executeAndVerifyTerminalExpression(
    screen,
    "dump(3)",
    `The expression could not be evaluated.`
  );
  await executeAndVerifyTerminalExpression(screen, "number", "10");
  await executeAndVerifyTerminalExpression(
    screen,
    "dump(3)",
    `The expression could not be evaluated.`
  );
  await executeAndVerifyTerminalExpression(screen, "number", "10");
  await executeAndVerifyTerminalExpression(screen, "testStepping2()", "undefined");
});
