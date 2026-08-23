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

// `regeneratorRuntime.js` is pretty-printed by the backend. Which line a statement lands on
// depends on the formatter version that produced the cached artifact for this recording,
// so accept either numbering for the frames that moved.
const tryCatchInnerFn = ["regeneratorRuntime.js:125", "regeneratorRuntime.js:136"];
const invokeMethod = ["regeneratorRuntime.js:69", "regeneratorRuntime.js:72"];

function expectFrames(actual: string[], expected: (string | string[])[]) {
  expect(actual).toHaveLength(expected.length);
  expected.forEach((expectedFrame, index) => {
    const candidates = typeof expectedFrame === "string" ? [expectedFrame] : expectedFrame;
    expect(candidates).toContain(actual[index]);
  });
}

test("sourcemap_stacktrace: Test that stacktraces are sourcemapped", async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);
  await openDevToolsTab(page);
  await openConsolePanel(page);

  const message = await findConsoleMessage(page, "Error: Baz", "console-error");
  const locations = await getFrameLocationsFromMessage(message);
  expectFrames(locations, [
    "App.js:35",
    "regeneratorRuntime.js:44",
    tryCatchInnerFn,
    invokeMethod,
    "asyncToGenerator.js:3",
    "asyncToGenerator.js:22",
  ]);
  await waitFor(async () => {
    const errorLocations = await getErrorFrameLocationsFromMessage(message);
    expectFrames(errorLocations.slice(0, 7), [
      "App.js:9",
      "App.js:33",
      "regeneratorRuntime.js:44",
      tryCatchInnerFn,
      invokeMethod,
      "asyncToGenerator.js:3",
      "asyncToGenerator.js:22",
    ]);
  });
});
