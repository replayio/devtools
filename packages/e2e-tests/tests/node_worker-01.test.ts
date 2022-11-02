import test from "@playwright/test";

import { startTest } from "../helpers";
import { openConsolePanel, warpToMessage } from "../helpers/console-panel";
import { rewindToLine, stepOverToLine } from "../helpers/pause-information-panel";
import { addBreakpoint } from "../helpers/source-panel";

test("node_worker-01: make sure node workers don't cause crashes", async ({ page }) => {
  await startTest(page, "node/run_worker.js");

  await openConsolePanel(page);

  await warpToMessage(page, "GotWorkerMessage pong");
  await stepOverToLine(page, 18);

  await addBreakpoint(page, { url: "run_worker.js", lineNumber: 13 });
  await rewindToLine(page, { lineNumber: 13 });

  await addBreakpoint(page, { url: "run_worker.js", lineNumber: 6 });
  await rewindToLine(page, { lineNumber: 6 });
});
