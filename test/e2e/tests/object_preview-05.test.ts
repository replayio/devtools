import config from "../config";
import { runClassicTest } from "../runTest";

it("Test scope mapping and switching between generated/original sources.", async () => {
  // Not supported on chromium, needs source maps.
  // https://github.com/RecordReplay/chromium/issues/5
  if (config.browserName !== "firefox") {
    return;
  }
  await runClassicTest({
    example: "doc_prod_bundle.html",
    script: "object_preview-05.js",
  });
});
