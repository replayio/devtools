import test, { Page, expect } from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import {
  resumeToLine,
  rewindToLine,
  reverseStepOverToLine,
  waitForFrameTimeline,
} from "../helpers/pause-information-panel";
import {
  openConsolePanel,
  warpToMessage,
  executeTerminalExpression,
  executeAndVerifyTerminalExpression,
  enableConsoleMessageType,
  verifyConsoleMessage,
  toggleSideFilters,
} from "../helpers/console-panel";
import { waitFor } from "../helpers/utils";

test("Node exception logpoints", async ({ page }) => {
  await startTest(page, "node/exceptions.js");

  await openConsolePanel(page);
  await toggleSideFilters(page, true);

  await enableConsoleMessageType(page, "exceptions");
  await enableConsoleMessageType(page, "logs");

  const messages = page.locator(`[data-test-name="LogContents"]`);
  await waitFor(async () => {
    // Wait for the new error messages to load
    const messageTexts = await messages.allTextContents();
    const hasExpectedExceptions = messageTexts.some(message => message.includes("number"));
    expect(hasExpectedExceptions).toBe(true);
  });

  await warpToMessage(page, "{number: 4}");
  await waitForFrameTimeline(page, "100%");

  await executeTerminalExpression(page, "number * 10");
  await verifyConsoleMessage(page, "40");

  await reverseStepOverToLine(page, 15);
  await waitForFrameTimeline(page, "0%");
});
