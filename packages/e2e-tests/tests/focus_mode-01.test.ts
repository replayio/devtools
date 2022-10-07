import test from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import {
  openConsolePanel,
  verifyConsoleMessage,
  verifyTrimmedConsoleMessages,
} from "../helpers/console-panel";
import { openSource } from "../helpers/source-explorer-panel";
import { addLogpoint } from "../helpers/source-panel";
import { clearFocusRange, setFocusRange } from "../helpers/timeline";

const url = "doc_rr_region_loading.html";

test("focus_mode-01: should filter messages as regions based on the active focus mode", async ({
  page,
}) => {
  await startTest(page, url);
  await openDevToolsTab(page);

  await openSource(page, url);
  await addLogpoint(page, {
    content: `"Log point", number`,
    lineNumber: 20,
    url,
  });

  await openConsolePanel(page);

  // Verify initially that all 50 messages are present
  await verifyConsoleMessage(page, "Log point", "log-point", 50);

  // Set focus region (to force-unload part of the recording)
  await setFocusRange(page, { startTimeString: "0:04", endTimeString: "0:05" });

  // Verify fewer messages
  await verifyConsoleMessage(page, "Log point", "log-point", 11);
  await verifyTrimmedConsoleMessages(page, { expectedBefore: 1, expectedAfter: 1 });

  // Clear focus region
  await clearFocusRange(page);

  // Verify 50 messages again
  await verifyConsoleMessage(page, "Log point", "log-point", 50);
});
