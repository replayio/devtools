import test from "@playwright/test";

import { startTest } from "../helpers";
import { reverseStepOverToLine } from "../helpers/pause-information-panel";
import {
  openConsolePanel,
  warpToMessage,
  executeAndVerifyTerminalExpression,
} from "../helpers/console-panel";
import { openSource } from "../helpers/source-explorer-panel";
import { addLogpoint } from "../helpers/source-panel";

test("node_logpoint-01: Basic node logpoints", async ({ page }) => {
  await startTest(page, "node/basic.js");

  await openConsolePanel(page);

  await openSource(page, "basic.js");

  await addLogpoint(page, { url: "basic.js", lineNumber: 4, content: `"CALL", i` });

  await warpToMessage(page, "CALL 2");

  // TODO [FE-626] Autocompletion behavior is breaking terminal expressions right now
  await executeAndVerifyTerminalExpression(page, "i", 2);

  await reverseStepOverToLine(page, 3);
});
