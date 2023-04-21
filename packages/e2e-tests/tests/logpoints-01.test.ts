import test, { expect } from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import {
  executeAndVerifyTerminalExpression,
  findConsoleMessage,
  openConsolePanel,
  seekToConsoleMessage,
} from "../helpers/console-panel";
import { resumeToLine, reverseStepOverToLine } from "../helpers/pause-information-panel";
import { addBreakpoint, addLogpoint } from "../helpers/source-panel";

const url = "doc_rr_basic.html";

test(`logpoints-01: log-points appear in the correct order and allow time warping`, async ({
  page,
}) => {
  await startTest(page, url);
  await openDevToolsTab(page);

  await addBreakpoint(page, { lineNumber: 20, url });
  await addLogpoint(page, {
    content: '"Logpoint Number " + number',
    lineNumber: 20,
    url,
  });

  await addLogpoint(page, {
    content: '"Logpoint Beginning"',
    lineNumber: 9,
    url,
  });

  await addLogpoint(page, {
    content: '"Logpoint Ending"',
    lineNumber: 7,
    url,
  });

  await openConsolePanel(page);

  const loadingMessages = await findConsoleMessage(page, "Loading", "log-point");
  await expect(loadingMessages).toHaveCount(0);

  const logPointMessages = await findConsoleMessage(page, "Logpoint", "log-point");
  await expect(logPointMessages).toHaveCount(12);
  await expect(logPointMessages.first()).toHaveText(/Beginning/);
  await expect(logPointMessages.last()).toHaveText(/Ending/);

  const message = await findConsoleMessage(page, "Number 5", "log-point");
  await seekToConsoleMessage(page, message);

  await executeAndVerifyTerminalExpression(page, "number", 5);
  await reverseStepOverToLine(page, 19);

  await resumeToLine(page, 20);
});
