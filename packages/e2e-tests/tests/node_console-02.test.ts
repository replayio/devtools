import test from "@playwright/test";

import { startTest } from "../helpers";
import { openConsolePanel, warpToMessage } from "../helpers/console-panel";
import { reverseStepOverToLine, waitForPaused } from "../helpers/pause-information-panel";

test("node_console-02: uncaught exceptions should show up", async ({ page }) => {
  await startTest(page, "node/error.js");
  await openConsolePanel(page);

  await warpToMessage(page, "ReferenceError: b is not defined");

  await waitForPaused(page, 2);
  await reverseStepOverToLine(page, 4);
});
