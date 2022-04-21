import config from "../config";
import { runClassicTest } from "../runTest";

it("Test that the element highlighter selects the correct element when they overlap.", async () => {
  // DOM inspection tests are not currently supported on chromium.
  // https://github.com/RecordReplay/chromium/issues/11
  if (config.browserName !== "firefox") {
    return;
  }
  await runClassicTest({
    example: "doc_stacking.html",
    script: "stacking.js",
  });
});
