import test from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import {
  executeAndVerifyTerminalExpression,
  openConsolePanel,
  warpToMessage,
} from "../helpers/console-panel";

const url = "doc_rr_basic.html";

test("support global console evaluations", async ({ page }) => {
  await startTest(page, url);
  await openDevToolsTab(page);
  await openConsolePanel(page);

  await executeAndVerifyTerminalExpression(page, "333", 333);
  await warpToMessage(page, "ExampleFinished", 7);
  await executeAndVerifyTerminalExpression(page, "number", 10);
  await executeAndVerifyTerminalExpression(page, "window.updateNumber", "ƒupdateNumber()");
});
