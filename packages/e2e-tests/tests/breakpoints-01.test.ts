import { openDevToolsTab, startTest, test } from "../helpers";
import { executeAndVerifyTerminalExpression } from "../helpers/console-panel";
import { resumeToLine, rewindToLine } from "../helpers/pause-information-panel";
import { addBreakpoint } from "../helpers/source-panel";

const url = "doc_rr_basic.html";

test(`Test basic breakpoint functionality.`, async ({ screen }) => {
  await startTest(screen, url);
  await openDevToolsTab(screen);

  await addBreakpoint(screen, { lineNumber: 21, url });

  await rewindToLine(screen, {
    lineNumber: 21,
  });
  await executeAndVerifyTerminalExpression(screen, "number", "10");
  await rewindToLine(screen, { lineNumber: 21 });
  await executeAndVerifyTerminalExpression(screen, "number", "9");
  await rewindToLine(screen, { lineNumber: 21 });
  await executeAndVerifyTerminalExpression(screen, "number", "8");
  await rewindToLine(screen, { lineNumber: 21 });
  await executeAndVerifyTerminalExpression(screen, "number", "7");
  await rewindToLine(screen, { lineNumber: 21 });
  await executeAndVerifyTerminalExpression(screen, "number", "6");
  await resumeToLine(screen, { lineNumber: 21 });
  await executeAndVerifyTerminalExpression(screen, "number", "7");
  await resumeToLine(screen, { lineNumber: 21 });
  await executeAndVerifyTerminalExpression(screen, "number", "8");
  await resumeToLine(screen, { lineNumber: 21 });
  await executeAndVerifyTerminalExpression(screen, "number", "9");
  await resumeToLine(screen, { lineNumber: 21 });
  await executeAndVerifyTerminalExpression(screen, "number", "10");
});
