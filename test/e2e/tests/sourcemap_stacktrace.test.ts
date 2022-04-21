import { runClassicTest } from "../runTest";

// Disabled because we can't record the example in CI
// https://github.com/RecordReplay/gecko-dev/issues/726
it.skip("Test that stacktraces are sourcemapped.", async () => {
  await runClassicTest({
    example: "cra/dist/index.html",
    script: "sourcemap_stacktrace.js",
  });
});
