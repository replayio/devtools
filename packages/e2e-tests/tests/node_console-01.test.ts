import test from "@playwright/test";

import { startTest } from "../helpers";
import {
  executeAndVerifyTerminalExpression,
  openConsolePanel,
  warpToMessage,
} from "../helpers/console-panel";
import { reverseStepOverToLine, waitForScopeValue } from "../helpers/pause-information-panel";

test("node_console-01: Basic node console behavior", async ({ page }) => {
  await startTest(page, "node/basic.js");
  await openConsolePanel(page);

  await warpToMessage(page, "HELLO 1");

  await executeAndVerifyTerminalExpression(page, "num", 1);
  await waitForScopeValue(page, "num", "1");
  await reverseStepOverToLine(page, 4);
});
