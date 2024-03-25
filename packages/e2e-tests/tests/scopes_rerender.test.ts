import { openDevToolsTab, startTest } from "../helpers";
import { openConsolePanel, warpToMessage } from "../helpers/console-panel";
import { selectFrame, waitForScopeValue } from "../helpers/pause-information-panel";
import test from "../testFixture";

test.use({ exampleKey: "doc_recursion.html" });

test("scopes_rerender: Test that scopes are rerendered", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);
  await openConsolePanel(page);

  await warpToMessage(page, "Hello 1");
  await waitForScopeValue(page, "n", "1");

  await selectFrame(page, 2);
  await waitForScopeValue(page, "n", "3");

  await selectFrame(page, 0);
  await waitForScopeValue(page, "n", "1");
});
