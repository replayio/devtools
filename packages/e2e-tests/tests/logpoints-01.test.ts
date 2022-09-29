import { expect } from "@playwright/test";

import { openDevToolsTab, startTest, test } from "../helpers";
import {
  executeAndVerifyTerminalExpression,
  findConsoleMessage,
  openConsolePanel,
  seekToConsoleMessage,
} from "../helpers/console-panel";
import { resumeToLine, reverseStepOverToLine } from "../helpers/pause-information-panel";
import { addLogpoint } from "../helpers/source-panel";

const url = "doc_rr_basic.html";

test(`log-points appear in the correct order and allow time warping`, async ({ screen }) => {
  await startTest(screen, url);
  await openDevToolsTab(screen);

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

  await openConsolePanel(screen);

  const loadingMessages = await findConsoleMessage(screen, "Loading", "log-point");
  await expect(loadingMessages).toHaveCount(0);

  const logPointMessages = await findConsoleMessage(screen, "Logpoint", "log-point");
  await expect(logPointMessages).toHaveCount(12);
  await expect(logPointMessages.first()).toHaveText(/Beginning/);
  await expect(logPointMessages.last()).toHaveText(/Ending/);

  const message = await findConsoleMessage(screen, "Number 5", "log-point");
  await seekToConsoleMessage(screen, message);

  await executeAndVerifyTerminalExpression(screen, "number", 5);
  await reverseStepOverToLine(screen, 19);

  // The log-point acts like a breakpoint when resuming.
  await resumeToLine(screen, { lineNumber: 20 });
});
