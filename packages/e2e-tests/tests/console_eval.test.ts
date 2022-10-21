import test from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import {
  executeAndVerifyTerminalExpression,
  openConsolePanel,
  warpToMessage,
} from "../helpers/console-panel";
import { seekToPreviousScreenshot } from "../helpers/timeline";

const url = "doc_rr_basic.html";

test("console_eval: support global console evaluations", async ({ page }) => {
  await startTest(page, url);
  await openDevToolsTab(page);
  await openConsolePanel(page);

  // in e2e tests replay always starts at the very end of the recording but at that point
  // console evaluations always fail, so we seek to the point of the last screenshot instead
  await seekToPreviousScreenshot(page);
  await executeAndVerifyTerminalExpression(page, "333", 333);

  await warpToMessage(page, "ExampleFinished", 7);
  await executeAndVerifyTerminalExpression(page, "number", 10);
  await executeAndVerifyTerminalExpression(page, "window.updateNumber", "ƒupdateNumber()");
});
