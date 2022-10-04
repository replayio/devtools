import test from "@playwright/test";

import { startTest } from "../helpers";
import { openConsolePanel, warpToMessage } from "../helpers/console-panel";
import { reverseStepOverToLine, waitForPaused } from "../helpers/pause-information-panel";

test("Basic node console behavior", async ({ page }) => {
  await startTest(page, "node/error.js");
  await openConsolePanel(page);

  await warpToMessage(page, "ReferenceError: b is not defined");

  await waitForPaused(page, 2);
  await reverseStepOverToLine(page, 4);
});
