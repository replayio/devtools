import test, { expect } from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import {
  findConsoleMessage,
  getFrameLocationsFromMessage,
  openConsolePanel,
} from "../helpers/console-panel";

test("sourcemap_stacktrace: Test that stacktraces are sourcemapped", async ({ page }) => {
  await startTest(page, "cra/dist/index.html");
  await openDevToolsTab(page);
  await openConsolePanel(page);

  const message = await findConsoleMessage(page, "Error: Baz", "console-error");
  const locations = await getFrameLocationsFromMessage(message);
  expect(locations).toEqual([
    "App.js:28",
    "runtime.js:63",
    "runtime.js:294",
    "runtime.js:119",
    "asyncToGenerator.js:3",
    "asyncToGenerator.js:25",
  ]);
});
