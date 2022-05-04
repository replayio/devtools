import { runClassicTest } from "../runTest";

// Disabled because we can't record the example in CI
// https://github.com/RecordReplay/gecko-dev/issues/726
it.skip("Test basic console time warping functionality.", async () => {
  await runClassicTest({
    example: "doc_rr_error.html",
    script: "console_warp-01.js",
  });
});
