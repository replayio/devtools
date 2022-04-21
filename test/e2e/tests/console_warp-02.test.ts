import { runClassicTest } from "../runTest";

it("Test which message is the paused one after warping, stepping, and evaluating.", async () => {
  await runClassicTest({
    example: "doc_rr_logs.html",
    script: "console_warp-02.js",
  });
});
