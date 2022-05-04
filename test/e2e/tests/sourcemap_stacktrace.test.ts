import { runClassicTest } from "../runTest";

it("Test that stacktraces are sourcemapped.", async () => {
  await runClassicTest({
    example: "cra/dist/index.html",
    script: "sourcemap_stacktrace.js",
  });
});
