import { startTest } from "../helpers";
import { openConsolePanel, warpToMessage } from "../helpers/console-panel";
import { waitForPaused, waitForScopeValue } from "../helpers/pause-information-panel";
import test from "../testFixture";

test.use({ exampleKey: "node/spawn.js" });

test("node_spawn: Basic subprocess spawning", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);

  await openConsolePanel(page);

  await warpToMessage(page, "sync 2");
  await waitForScopeValue(page, "n", 2);

  await warpToMessage(page, "async 5");
  // This _shouldn't_ be necessary, but `waitForScopeValue` is running too soon
  // and ends up closing open scopes, or they're getting replaced by the new pause
  await waitForPaused(page, 15);
  await waitForScopeValue(page, "i", 5);
});
