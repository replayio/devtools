import test from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import {
  findConsoleMessage,
  openConsolePanel,
  setConsoleMessageAsFocusEnd,
  setConsoleMessageAsFocusStart,
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

  // St the start of the focus region, to force-unload the beginning of the recording.
  await setConsoleMessageAsFocusStart(page, await findConsoleMessage(page, "34", "log-point"));

  // Verify fewer messages
  await verifyConsoleMessage(page, "Log point", "log-point", 17);
  await verifyTrimmedConsoleMessages(page, { expectedBefore: 1, expectedAfter: 0 });

  // Set end of focus region to force-unload the end of the recording.
  await setConsoleMessageAsFocusEnd(page, await findConsoleMessage(page, "44", "log-point"));

  // Verify fewer messages
  await verifyConsoleMessage(page, "Log point", "log-point", 11);
  await verifyTrimmedConsoleMessages(page, { expectedBefore: 1, expectedAfter: 1 });

  // Clear focus region
  await clearFocusRange(page);

  // Verify 50 messages again
  await verifyConsoleMessage(page, "Log point", "log-point", 50);
});
