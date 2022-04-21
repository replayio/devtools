import { runClassicTest } from "../runTest";

// Disabled because we can't record the example in CI
// https://github.com/RecordReplay/gecko-dev/issues/726
it.skip("Test React DevTools.", async () => {
  await runClassicTest({
    example: "cra/dist/index.html",
    script: "react_devtools.js",
  });
});
