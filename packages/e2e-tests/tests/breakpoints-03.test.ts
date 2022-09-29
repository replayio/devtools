import { openDevToolsTab, startTest, test } from "../helpers";
import { executeAndVerifyTerminalExpression } from "../helpers/console-panel";
import { resumeToLine, rewindToLine } from "../helpers/pause-information-panel";
import { addBreakpoint, removeBreakpoint } from "../helpers/source-panel";

const url = "doc_rr_basic.html";

test(`Test stepping forward through breakpoints when rewound before the first one.`, async ({
  screen,
}) => {
  await startTest(screen, url);
  await openDevToolsTab(screen);

  await addBreakpoint(screen, { lineNumber: 8, url });
  // Rewind to when the point was hit
  await rewindToLine(screen, { lineNumber: 8 });
  // Rewind further (past the first hit)
  await rewindToLine(screen);

  await removeBreakpoint(screen, { lineNumber: 8, url });

  await addBreakpoint(screen, { lineNumber: 21, url });
  await resumeToLine(screen, { lineNumber: 21 });
  await executeAndVerifyTerminalExpression(screen, "number", "1");
  await resumeToLine(screen, { lineNumber: 21 });
  await executeAndVerifyTerminalExpression(screen, "number", "2");
});
