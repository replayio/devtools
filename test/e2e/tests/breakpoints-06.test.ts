import config from "../config";
import { runClassicTest } from "../runTest";

it("Test breakpoints in a sourcemapped file.", async () => {
  // Not supported on chromium, needs source maps.
  // https://github.com/RecordReplay/chromium/issues/5
  if (config.browserName !== "firefox") {
    return;
  }
  await runClassicTest({
    example: "doc_prod_bundle.html",
    script: "breakpoints-06.js",
  });
});
