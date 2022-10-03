import test, { Page, expect } from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import {
  resumeToLine,
  rewindToLine,
  reverseStepOverToLine,
  waitForFrameTimeline,
  waitForScopeValue,
  expandAllScopesBlocks,
  waitForPaused,
  stepOverToLine,
} from "../helpers/pause-information-panel";
import {
  openConsolePanel,
  warpToMessage,
  executeTerminalExpression,
  executeAndVerifyTerminalExpression,
  enableConsoleMessageType,
  verifyConsoleMessage,
} from "../helpers/console-panel";
import { openSource, openSourceExplorerPanel } from "../helpers/source-explorer-panel";
import { addLogpoint, addBreakpoint } from "../helpers/source-panel";
import { delay, waitFor } from "../helpers/utils";

test("Basic subprocess spawning", async ({ page }) => {
  await startTest(page, "node/run_worker.js");

  await openConsolePanel(page);

  await warpToMessage(page, "GotWorkerMessage pong");
  await stepOverToLine(page, 18);

  await addBreakpoint(page, { url: "run_worker.js", lineNumber: 13 });
  await rewindToLine(page, { lineNumber: 13 });

  await addBreakpoint(page, { url: "run_worker.js", lineNumber: 6 });
  await rewindToLine(page, { lineNumber: 6 });
});
