import { expect } from "@playwright/test";

import { openDevToolsTab, startTest, test } from "../helpers";
import {
  executeAndVerifyTerminalExpression,
  findConsoleMessage,
  openConsolePanel,
  seekToConsoleMessage,
} from "../helpers/console-panel";
import { reverseStepOverToLine, waitForFrameTimeline } from "../helpers/pause-information-panel";

const url = "doc_exceptions.html";

test(`should display exceptions in the console`, async ({ screen }) => {
  await startTest(screen, url);
  await openDevToolsTab(screen);

  await openConsolePanel(screen);

  await screen.queryByTestId("FilterToggle-exceptions").click();

  let messages = await findConsoleMessage(screen, undefined, "exception");
  await expect(messages).toHaveCount(20);

  messages = await findConsoleMessage(screen, "number: 4", "exception");
  await seekToConsoleMessage(screen, messages.first());
  await waitForFrameTimeline(screen, "100%");

  messages = await findConsoleMessage(screen, "number: 10", "exception");
  await seekToConsoleMessage(screen, messages.first());
  await executeAndVerifyTerminalExpression(screen, "number * 10", "40");

  await reverseStepOverToLine(screen, 15);
  await waitForFrameTimeline(screen, "0%");
});
