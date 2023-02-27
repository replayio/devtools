import test, { expect } from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import {
  findConsoleMessage,
  getErrorFrameLocationsFromMessage,
  getFrameLocationsFromMessage,
  openConsolePanel,
} from "../helpers/console-panel";
import { delay } from "../helpers/utils";

test("sourcemap_stacktrace: Test that stacktraces are sourcemapped", async ({ page }) => {
  await startTest(page, "cra/dist/index.html");
  await openDevToolsTab(page);
  await openConsolePanel(page);

  const message = await findConsoleMessage(page, "Error: Baz", "console-error");
  const locations = await getFrameLocationsFromMessage(message);
  expect(locations).toEqual([
    "App.js:35",
    "regeneratorRuntime.js:44",
    "regeneratorRuntime.js:125",
    "regeneratorRuntime.js:69",
    "asyncToGenerator.js:3",
    "asyncToGenerator.js:22",
  ]);
  const errorLocations = await getErrorFrameLocationsFromMessage(message);

  await delay(1000);
  expect(errorLocations.slice(0, 7)).toEqual([
    "App.js:9",
    "App.js:33",
    "regeneratorRuntime.js:44",
    "regeneratorRuntime.js:125",
    "regeneratorRuntime.js:69",
    "asyncToGenerator.js:3",
    "asyncToGenerator.js:22",
  ]);
});
