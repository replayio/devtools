import test from "@playwright/test";

import { getRecordingTarget, openDevToolsTab, startTest } from "../helpers";
import {
  executeAndVerifyTerminalExpression,
  openConsolePanel,
  warpToMessage,
} from "../helpers/console-panel";
import {
  resumeToLine,
  reverseStepOverToLine,
  rewindToLine,
} from "../helpers/pause-information-panel";
import { addBreakpoint } from "../helpers/source-panel";

const url = "doc_rr_error.html";

test(`should support warping to console messages.`, async ({ page }) => {
  await startTest(page, url);
  await openDevToolsTab(page);
  await openConsolePanel(page);

  await warpToMessage(page, "Number 5", 19);
  await executeAndVerifyTerminalExpression(page, "number", 5);

  const target = await getRecordingTarget(page);
  if (target == "gecko") {
    // Initially we are paused inside the 'new Error()' call on line 19. The
    // first reverse step takes us to the start of that line.
    await reverseStepOverToLine(page, 19);
  }

  await reverseStepOverToLine(page, 18);
  await addBreakpoint(page, { lineNumber: 12, url });
  await rewindToLine(page, { lineNumber: 12, url });
  await executeAndVerifyTerminalExpression(page, "number", 4);
  await resumeToLine(page, { lineNumber: 12, url });
  await executeAndVerifyTerminalExpression(page, "number", 5);

  // This error message has different text on gecko vs. chromium.
  const errorText =
    target == "gecko" ? "window.foo is undefined" : "Cannot set property 'bar' of undefined";
  await warpToMessage(page, errorText);
  await reverseStepOverToLine(page, 8);

  await warpToMessage(page, "superclass", 40);

  if (target == "gecko") {
    // As above, we need an additional reverse step over in gecko.
    await reverseStepOverToLine(page, 40);
  }

  await reverseStepOverToLine(page, 39);
});
