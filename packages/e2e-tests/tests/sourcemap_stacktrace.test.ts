import { openDevToolsTab, startTest } from "../helpers";
import {
  findConsoleMessage,
  getErrorFrameLocationsFromMessage,
  getFrameLocationsFromMessage,
  openConsolePanel,
} from "../helpers/console-panel";
import { toggleExpandable, waitFor } from "../helpers/utils";
import test, { expect } from "../testFixtureCloneRecording";

test.use({ exampleKey: "cra/dist/index.html" });

test("sourcemap_stacktrace: Test that stacktraces are sourcemapped", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);
  await openConsolePanel(page);

  // TODO [FE-2109][RUN-2962] Chromium incorrectly categorizes console.error() as console.info()
  const message = await findConsoleMessage(page, 'message: "Baz"', "console-log");

  // TODO [FE-2109][RUN-2962] Because of the above the console message itself won't have a stack.
  // The call stack in the Error object is not source mapped, so there's nothing meaningful we can test here.
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
