import { expect } from "@playwright/test";

import {
  checkEvaluateInTopFrame,
  clickDevTools,
  getConsoleMessage,
  openExample,
  reverseStepOverToLine,
  seekToConsoleMessage,
  selectConsole,
  test,
  waitForFrameTimeline,
} from "../helpers";

const url = "doc_exceptions.html";

test(`should display exceptions in the console`, async ({ screen }) => {
  await openExample(screen, url);
  await clickDevTools(screen);

  await selectConsole(screen);

  await screen.queryByTestId("FilterToggle-exceptions").click();

  let messages = await getConsoleMessage(screen, undefined, "exception");
  await expect(messages).toHaveCount(20);

  messages = await getConsoleMessage(screen, "number: 4", "exception");
  await seekToConsoleMessage(screen, messages.first());
  await waitForFrameTimeline(screen, "100%");

  messages = await getConsoleMessage(screen, "number: 10", "exception");
  await seekToConsoleMessage(screen, messages.first());
  await checkEvaluateInTopFrame(screen, "number * 10", "40");

  await reverseStepOverToLine(screen, 15);
  await waitForFrameTimeline(screen, "0%");
});
