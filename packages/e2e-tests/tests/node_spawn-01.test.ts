import test from "@playwright/test";

import { startTest } from "../helpers";
import { waitForScopeValue, waitForPaused } from "../helpers/pause-information-panel";
import { openConsolePanel, warpToMessage } from "../helpers/console-panel";

test("Basic subprocess spawning", async ({ page }) => {
  await startTest(page, "node/spawn.js");

  await openConsolePanel(page);

  // TODO [FE-626] This really needs an `{exact? boolean}` flag, as there are multiple messages
  // with overlapping partial text ("async 2", "sync 2").
  await warpToMessage(page, "sync 2");
  await waitForScopeValue(page, "n", 2);

  await warpToMessage(page, "async 5");
  // This _shouldn't_ be necessary, but `waitForScopeValue` is running too soon
  // and ends up closing open scopes, or they're getting replaced by the new pause
  await waitForPaused(page, 15);
  await waitForScopeValue(page, "i", 5);
});
