import config from "../config";
import { runClassicTest } from "../runTest";

it("Test that styles for elements can be viewed.", async () => {
  // DOM inspection tests are not currently supported on chromium.
  // https://github.com/RecordReplay/chromium/issues/11
  if (config.browserName !== "firefox") {
    return;
  }
  await runClassicTest({
    example: "doc_inspector_styles.html",
    script: "inspector-03.js",
  });
});
