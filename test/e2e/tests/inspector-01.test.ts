import config from "../config";
import { runClassicTest } from "../runTest";

it("Test basic inspector functionality: the inspector is able to show contents when paused according to the child's current position.", async () => {
  // DOM inspection tests are not currently supported on chromium.
  // https://github.com/RecordReplay/chromium/issues/11
  if (config.browserName !== "firefox") {
    return;
  }
  await runClassicTest({
    example: "doc_inspector_basic.html",
    script: "inspector-01.js",
  });
});
