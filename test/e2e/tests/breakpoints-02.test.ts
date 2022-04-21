import config from "../config";
import { runClassicTest } from "../runTest";

it("Test unhandled divergence while evaluating at a breakpoint.", async () => {
  // Not supported on chromium: this test uses dump() to trigger an evaluation
  // failure, but dump() is not a standard function and isn't implemented
  // in chromium.
  if (config.browserName !== "firefox") {
    return;
  }
  await runClassicTest({
    example: "doc_rr_basic.html",
    script: "breakpoints-02.js",
  });
});
