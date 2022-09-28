import { expect } from "@playwright/test";

import {
  addLogpoint,
  checkEvaluateInTopFrame,
  clickDevTools,
  openExample,
  test,
  resumeToLine,
  selectConsole,
  getConsoleMessage,
  seekToConsoleMessage,
  reverseStepOverToLine,
} from "../helpers";

const url = "doc_rr_basic.html";

test(`log-points appear in the correct order and allow time warping`, async ({ screen }) => {
  await openExample(screen, url);
  await clickDevTools(screen);

  await addLogpoint(screen, {
    content: '"Logpoint Number " + number',
    lineNumber: 20,
    url,
  });

  await addLogpoint(screen, {
    content: '"Logpoint Beginning"',
    lineNumber: 9,
    url,
  });

  await addLogpoint(screen, {
    content: '"Logpoint Ending"',
    lineNumber: 7,
    url,
  });

  await selectConsole(screen);

  const loadingMessages = await getConsoleMessage(screen, "Loading", "log-point");
  await expect(loadingMessages).toHaveCount(0);

  const logPointMessages = await getConsoleMessage(screen, "Logpoint", "log-point");
  await expect(logPointMessages).toHaveCount(12);
  await expect(logPointMessages.first()).toHaveText(/Beginning/);
  await expect(logPointMessages.last()).toHaveText(/Ending/);

  const message = await getConsoleMessage(screen, "Number 5", "log-point");
  await seekToConsoleMessage(screen, message);

  await checkEvaluateInTopFrame(screen, "number", 5);
  await reverseStepOverToLine(screen, 19);

  // The log-point acts like a breakpoint when resuming.
  await resumeToLine(screen, { lineNumber: 20 });
});
