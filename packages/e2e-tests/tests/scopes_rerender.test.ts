import test from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import { openConsolePanel, warpToMessage } from "../helpers/console-panel";
import { selectFrame, waitForScopeValue } from "../helpers/pause-information-panel";

test("scopes_rerender: Test that scopes are rerendered", async ({ page }) => {
  await startTest(page, "doc_recursion.html");
  await openDevToolsTab(page);
  await openConsolePanel(page);

  await warpToMessage(page, "Hello 1");
  await waitForScopeValue(page, "n", "1");

  await selectFrame(page, 2);
  await waitForScopeValue(page, "n", "3");

  await selectFrame(page, 0);
  await waitForScopeValue(page, "n", "1");
});
