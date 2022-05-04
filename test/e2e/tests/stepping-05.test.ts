import config from "../config";
import { runClassicTest } from "../runTest";

it("Test stepping in pretty-printed code.", async () => {
  // Not supported on chromium, needs event listener support.
  // https://github.com/RecordReplay/chromium/issues/7
  if (config.browserName !== "firefox") {
    return;
  }
  await runClassicTest({
    example: "doc_minified.html",
    script: "stepping-05.js",
  });
});
