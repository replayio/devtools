import { startTest } from "../helpers";
import {
  enableConsoleMessageType,
  executeTerminalExpression,
  openConsolePanel,
  toggleSideFilters,
  verifyConsoleMessage,
  warpToMessage,
} from "../helpers/console-panel";
import { reverseStepOverToLine, waitForFrameTimeline } from "../helpers/pause-information-panel";
import { waitFor } from "../helpers/utils";
import test, { expect } from "../testFixture";

test.use({ exampleKey: "node/exceptions.js" });

test.skip("node_logpoint-02: Node exception logpoints", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);

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
