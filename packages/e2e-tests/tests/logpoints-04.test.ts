import test, { expect } from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import {
  executeAndVerifyTerminalExpression,
  findConsoleMessage,
  openConsolePanel,
  seekToConsoleMessage,
  toggleSideFilters,
} from "../helpers/console-panel";
import { reverseStepOverToLine, waitForFrameTimeline } from "../helpers/pause-information-panel";

const url = "doc_exceptions.html";

test(`logpoints-04: should display exceptions in the console`, async ({ page }) => {
  await startTest(page, url);
  await openDevToolsTab(page);

  await openConsolePanel(page);
  await toggleSideFilters(page, true);

  await page.locator('[data-test-id="FilterToggle-exceptions"]').click();

  let messages = await findConsoleMessage(page, undefined, "exception");
  await expect(messages).toHaveCount(20);

  messages = await findConsoleMessage(page, "number: 4", "exception");
  await seekToConsoleMessage(page, messages.first());
  await waitForFrameTimeline(page, "100%");

  await executeAndVerifyTerminalExpression(page, "number * 10", "40");

  await reverseStepOverToLine(page, 15);
  await waitForFrameTimeline(page, "0%");
});
