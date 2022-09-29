import { openDevToolsTab, startTest, test } from "../helpers";
import { openConsolePanel, warpToMessage } from "../helpers/console-panel";
import {
  expandFirstScope,
  selectFrame,
  waitForScopeValue,
} from "../helpers/pause-information-panel";

test("Test that scopes are rerendered.", async ({ screen }) => {
  await startTest(screen, "doc_recursion.html");
  await openDevToolsTab(screen);
  await openConsolePanel(screen);

  await warpToMessage(screen, "Hello 1");
  await expandFirstScope(screen);
  await waitForScopeValue(screen, "n", "1");

  await selectFrame(screen, 2);
  await waitForScopeValue(screen, "n", "3");

  await selectFrame(screen, 0);
  await waitForScopeValue(screen, "n", "1");
});
