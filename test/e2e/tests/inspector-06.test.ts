import config from "../config";
import { runClassicTest } from "../runTest";

it("Test showing both longhand and shorthand properties in rules.", async () => {
  // DOM inspection tests are not currently supported on chromium.
  // https://github.com/RecordReplay/chromium/issues/11
  if (config.browserName !== "firefox") {
    return;
  }
  await runClassicTest({
    example: "doc_inspector_shorthand.html",
    script: "inspector-06.js",
  });
});
