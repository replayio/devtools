import config from "../config";
import { runClassicTest } from "../runTest";

it("Test that the element highlighter works everywhere.", async () => {
  // DOM inspection tests are not currently supported on chromium.
  // https://github.com/RecordReplay/chromium/issues/11
  if (config.browserName !== "firefox") {
    return;
  }
  await runClassicTest({
    example: "doc_inspector_basic.html",
    script: "highlighter.js",
  });
});
