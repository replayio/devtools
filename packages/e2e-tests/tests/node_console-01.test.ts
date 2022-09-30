import test from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import {
  openConsolePanel,
  warpToMessage,
  executeAndVerifyTerminalExpression,
} from "../helpers/console-panel";
import {
  selectFrame,
  reverseStepOverToLine,
  waitForScopeValue,
} from "../helpers/pause-information-panel";

test("Basic node console behavior", async ({ page }) => {
  await startTest(page, "node/basic.js");
  await openConsolePanel(page);

  await warpToMessage(page, "HELLO 1");

  await executeAndVerifyTerminalExpression(page, "num", 1);
  await waitForScopeValue(page, "num", "1");
  await reverseStepOverToLine(page, 4);
});
