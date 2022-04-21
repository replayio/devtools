import config from "../config";
import { runClassicTest } from "../runTest";

it("Test showing rules in source mapped style sheets.", async () => {
  // DOM inspection tests are not currently supported on chromium.
  // https://github.com/RecordReplay/chromium/issues/11
  if (config.browserName !== "firefox") {
    return;
  }
  await runClassicTest({
    example: "doc_inspector_sourcemapped.html",
    script: "inspector-05.js",
  });
});
