import { openDevToolsTab, startTest } from "../helpers";
import {
  findConsoleMessage,
  getErrorFrameLocationsFromMessage,
  getFrameLocationsFromMessage,
  openConsolePanel,
} from "../helpers/console-panel";
import { waitFor } from "../helpers/utils";
import test, { expect } from "../testFixture";

test.use({ exampleKey: "cra/dist/index.html" });

test("sourcemap_stacktrace: Test that stacktraces are sourcemapped", async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);
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
  await waitFor(async () => {
    const errorLocations = await getErrorFrameLocationsFromMessage(message);
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
});
