import config from "../config";
import { runClassicTest } from "../runTest";

it("Test event logpoints when replaying.", async () => {
  // Not supported on chromium, needs event listener support.
  // https://github.com/RecordReplay/chromium/issues/7
  if (config.browserName !== "firefox") {
    return;
  }
  await runClassicTest({
    example: "doc_events.html",
    script: "logpoint-03.js",
  });
});
